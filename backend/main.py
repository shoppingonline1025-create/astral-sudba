import ephem
import math
import os
import json
import requests
from datetime import date, datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

app = FastAPI(title="Астральная Судьба API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_KEY = os.getenv("GEMINI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

genai.configure(api_key=GEMINI_KEY)
gemini = genai.GenerativeModel("gemini-1.5-flash")

# ─── Астрологические константы ───────────────────────────────────────────────

ZODIAC_RU = [
    'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
    'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы'
]
PLANET_RU = {
    'sun': 'Солнце ☀️', 'moon': 'Луна 🌙', 'mercury': 'Меркурий ☿',
    'venus': 'Венера ♀️', 'mars': 'Марс ♂️',
    'jupiter': 'Юпитер ♃', 'saturn': 'Сатурн ♄',
}
ASPECT_RU = {
    'conjunction': 'Соединение ☌', 'sextile': 'Секстиль ✶',
    'square': 'Квадрат □', 'trine': 'Трин △', 'opposition': 'Оппозиция ☍',
}
ASPECT_ANGLES = {'conjunction': 0, 'sextile': 60, 'square': 90, 'trine': 120, 'opposition': 180}

# ─── Расчёты ─────────────────────────────────────────────────────────────────

def ecl_lon(planet_obj):
    ecl = ephem.Ecliptic(planet_obj, epoch=ephem.J2000)
    return math.degrees(ecl.lon) % 360

def get_sign(lon):
    return ZODIAC_RU[int(lon / 30) % 12], round(lon % 30, 1)

def calc_positions(year, month, day, hour, minute, lat, lon):
    obs = ephem.Observer()
    obs.lat = str(lat)
    obs.lon = str(lon)
    obs.date = f"{year}/{month}/{day} {hour}:{minute}:00"
    obs.pressure = 0
    obs.epoch = ephem.J2000

    planets_map = {
        'sun': ephem.Sun(obs), 'moon': ephem.Moon(obs),
        'mercury': ephem.Mercury(obs), 'venus': ephem.Venus(obs),
        'mars': ephem.Mars(obs), 'jupiter': ephem.Jupiter(obs),
        'saturn': ephem.Saturn(obs),
    }
    result = {}
    for key, obj in planets_map.items():
        lon_deg = ecl_lon(obj)
        sign, deg = get_sign(lon_deg)
        result[key] = {'lon': round(lon_deg, 2), 'sign': sign, 'degree': deg, 'name_ru': PLANET_RU[key]}
    return result

def find_aspects(natal, transits, orb=6):
    aspects = []
    for t_key, t_data in transits.items():
        for n_key, n_data in natal.items():
            diff = abs(t_data['lon'] - n_data['lon'])
            if diff > 180:
                diff = 360 - diff
            for asp, angle in ASPECT_ANGLES.items():
                if abs(diff - angle) <= orb:
                    aspects.append({
                        'transit': PLANET_RU[t_key],
                        'aspect': ASPECT_RU[asp],
                        'natal': PLANET_RU[n_key],
                        'orb': round(abs(diff - angle), 1),
                        't_sign': t_data['sign'],
                        'n_sign': n_data['sign'],
                    })
    aspects.sort(key=lambda x: x['orb'])
    return aspects[:6]

def geocode(city):
    try:
        r = requests.get(
            f"https://nominatim.openstreetmap.org/search?q={city}&format=json&limit=1",
            headers={"User-Agent": "AstralSudba/1.0"}, timeout=5
        )
        data = r.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception:
        pass
    return 55.7558, 37.6173  # Москва fallback

# ─── Supabase helpers ─────────────────────────────────────────────────────────

def sb_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

def sb_get_user(telegram_id):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/users?telegram_id=eq.{telegram_id}&select=*",
        headers=sb_headers()
    )
    data = r.json()
    return data[0] if data else None

def sb_get_forecast(telegram_id, today):
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/forecasts?telegram_id=eq.{telegram_id}&date=eq.{today}&select=*",
        headers=sb_headers()
    )
    data = r.json()
    return data[0] if data else None

def sb_save_forecast(telegram_id, today, content):
    requests.post(
        f"{SUPABASE_URL}/rest/v1/forecasts",
        headers={**sb_headers(), "Prefer": "return=minimal"},
        data=json.dumps({"telegram_id": telegram_id, "date": today, "content": content})
    )

# ─── API endpoints ────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "Астральная Судьба"}


@app.get("/api/forecast/{telegram_id}")
async def get_forecast(telegram_id: int):
    today = str(date.today())

    # Проверяем кэш
    cached = sb_get_forecast(telegram_id, today)
    if cached:
        return cached['content']

    # Получаем пользователя
    user = sb_get_user(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    # Парсим дату/время рождения
    bdate = datetime.strptime(user['birthdate'], "%Y-%m-%d")
    btime = datetime.strptime(user.get('birthtime', '12:00:00'), "%H:%M:%S")

    # Геокодируем город если нет координат
    lat = user.get('birth_lat') or 0
    lon = user.get('birth_lon') or 0
    if (not lat or lat == 55.7558) and user.get('birthplace'):
        lat, lon = geocode(user['birthplace'])

    # Натальная карта
    natal = calc_positions(bdate.year, bdate.month, bdate.day, btime.hour, btime.minute, lat, lon)

    # Сегодняшние транзиты
    today_dt = date.today()
    transits = calc_positions(today_dt.year, today_dt.month, today_dt.day, 12, 0, lat, lon)

    # Аспекты
    aspects = find_aspects(natal, transits)

    # Формируем описание для Gemini
    natal_desc = "\n".join([f"  {v['name_ru']}: {v['degree']}° {v['sign']}" for v in natal.values()])
    asp_desc = "\n".join([
        f"  {a['transit']} {a['aspect']} натальный {a['natal']} (орб {a['orb']}°)"
        for a in aspects
    ]) or "  Нет выраженных транзитов"

    prompt = f"""Ты опытный астролог. Составь персональный прогноз на сегодня ({today}).

Имя: {user['name']}
Дата рождения: {user['birthdate']}, {user.get('birthtime','12:00')}, {user.get('birthplace','')}

Натальная карта:
{natal_desc}

Активные транзиты сегодня:
{asp_desc}

Луна сегодня в знаке: {transits['moon']['sign']}

Составь прогноз. Обращайся к пользователю по имени {user['name']}.
Пиши живо, конкретно, без общих фраз. Учитывай реальные аспекты.

Ответь ТОЛЬКО валидным JSON (без markdown, без ```):
{{
  "title": "заголовок дня (5-7 слов)",
  "energy": <число 1-10>,
  "moon": "Луна в {transits['moon']['sign']}",
  "summary": "общий прогноз (3-4 предложения лично для {user['name']})",
  "career": "карьера и дела (2-3 предложения)",
  "love": "отношения (2 предложения)",
  "health": "здоровье (1-2 предложения)",
  "best_time": "лучшее время (например: 14:00–18:00)",
  "advice": "главный совет дня (1 предложение)"
}}"""

    try:
        response = gemini.generate_content(prompt)
        text = response.text.strip()
        # Убираем markdown если есть
        if '```' in text:
            text = text.split('```')[1]
            if text.startswith('json'):
                text = text[4:]
        forecast = json.loads(text.strip())
    except Exception as e:
        forecast = {
            "title": "День открытий",
            "energy": 7,
            "moon": f"Луна в {transits['moon']['sign']}",
            "summary": f"Сегодня планеты создают благоприятный фон для {user['name']}. Хороший день для важных шагов.",
            "career": "Деловая активность на подъёме. Доверяйте своим решениям.",
            "love": "Открытость и искренность укрепят ваши отношения.",
            "health": "Уделите время отдыху и восстановлению сил.",
            "best_time": "12:00–16:00",
            "advice": "Следуйте интуиции — она не подведёт.",
        }

    # Сохраняем в кэш
    sb_save_forecast(telegram_id, today, forecast)
    return forecast


@app.get("/api/natal-chart/{telegram_id}")
async def get_natal_chart(telegram_id: int):
    user = sb_get_user(telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    bdate = datetime.strptime(user['birthdate'], "%Y-%m-%d")
    btime = datetime.strptime(user.get('birthtime', '12:00:00'), "%H:%M:%S")

    lat = user.get('birth_lat') or 0
    lon = user.get('birth_lon') or 0
    if (not lat or lat == 55.7558) and user.get('birthplace'):
        lat, lon = geocode(user['birthplace'])

    positions = calc_positions(bdate.year, bdate.month, bdate.day, btime.hour, btime.minute, lat, lon)

    return {
        "name": user['name'],
        "birthdate": user['birthdate'],
        "birthplace": user.get('birthplace'),
        "planets": [
            {"name": v['name_ru'], "sign": v['sign'], "degree": v['degree']}
            for v in positions.values()
        ]
    }
