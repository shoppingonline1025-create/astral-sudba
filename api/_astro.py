"""Общие функции для астрологических расчётов"""
import ephem
import math
import json
import os
import requests
import google.generativeai as genai

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://hkurtoonrpxnrspmuzgt.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_G3X4bzQpmaQ-GRjMRvQhhw_ft3Feab9")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAOskxKqsmk718oCtgcXS1fW4yBCOy90Wo")

ZODIAC_RU = ['Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец','Козерог','Водолей','Рыбы']
PLANET_RU = {
    'sun':'Солнце ☀️','moon':'Луна 🌙','mercury':'Меркурий ☿',
    'venus':'Венера ♀️','mars':'Марс ♂️','jupiter':'Юпитер ♃','saturn':'Сатурн ♄',
}
ASPECT_RU = {
    'conjunction':'Соединение ☌','sextile':'Секстиль ✶',
    'square':'Квадрат □','trine':'Трин △','opposition':'Оппозиция ☍',
}
ASPECT_ANGLES = {'conjunction':0,'sextile':60,'square':90,'trine':120,'opposition':180}

def ecl_lon(obj):
    e = ephem.Ecliptic(obj, epoch=ephem.J2000)
    return math.degrees(e.lon) % 360

def get_sign(lon):
    return ZODIAC_RU[int(lon/30)%12], round(lon%30, 1)

def calc_positions(year, month, day, hour, minute, lat, lon):
    obs = ephem.Observer()
    obs.lat = str(lat); obs.lon = str(lon)
    obs.date = f"{year}/{month}/{day} {hour}:{minute}:00"
    obs.pressure = 0; obs.epoch = ephem.J2000
    objs = {
        'sun':ephem.Sun(obs),'moon':ephem.Moon(obs),'mercury':ephem.Mercury(obs),
        'venus':ephem.Venus(obs),'mars':ephem.Mars(obs),'jupiter':ephem.Jupiter(obs),'saturn':ephem.Saturn(obs),
    }
    result = {}
    for k, o in objs.items():
        lon_deg = ecl_lon(o)
        sign, deg = get_sign(lon_deg)
        result[k] = {'lon':round(lon_deg,2),'sign':sign,'degree':deg,'name_ru':PLANET_RU[k]}
    return result

def find_aspects(natal, transits, orb=6):
    aspects = []
    for t_k, t in transits.items():
        for n_k, n in natal.items():
            diff = abs(t['lon'] - n['lon'])
            if diff > 180: diff = 360 - diff
            for asp, angle in ASPECT_ANGLES.items():
                if abs(diff - angle) <= orb:
                    aspects.append({
                        'transit': PLANET_RU[t_k], 'aspect': ASPECT_RU[asp],
                        'natal': PLANET_RU[n_k], 'orb': round(abs(diff-angle),1),
                    })
    aspects.sort(key=lambda x: x['orb'])
    return aspects[:6]

def geocode(city):
    try:
        r = requests.get(
            f"https://nominatim.openstreetmap.org/search?q={city}&format=json&limit=1",
            headers={"User-Agent":"AstralSudba/1.0"}, timeout=5
        )
        data = r.json()
        if data: return float(data[0]['lat']), float(data[0]['lon'])
    except: pass
    return 55.7558, 37.6173

def sb_headers():
    return {"apikey":SUPABASE_KEY,"Authorization":f"Bearer {SUPABASE_KEY}","Content-Type":"application/json"}

def sb_get_user(tg_id):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/users?telegram_id=eq.{tg_id}&select=*", headers=sb_headers())
    d = r.json()
    return d[0] if d else None

def sb_get_forecast(tg_id, today):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/forecasts?telegram_id=eq.{tg_id}&date=eq.{today}&select=*", headers=sb_headers())
    d = r.json()
    return d[0] if d else None

def sb_save_forecast(tg_id, today, content):
    requests.post(
        f"{SUPABASE_URL}/rest/v1/forecasts",
        headers={**sb_headers(),"Prefer":"return=minimal"},
        data=json.dumps({"telegram_id":tg_id,"date":today,"content":content})
    )

def generate_forecast(user, natal, transits, aspects, today):
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel("gemini-1.5-flash")
    natal_desc = "\n".join([f"  {v['name_ru']}: {v['degree']}° {v['sign']}" for v in natal.values()])
    asp_desc = "\n".join([f"  {a['transit']} {a['aspect']} натальный {a['natal']} (орб {a['orb']}°)" for a in aspects]) or "  Нет выраженных транзитов"
    prompt = f"""Ты опытный астролог. Составь персональный прогноз на сегодня ({today}).

Имя: {user['name']}
Дата рождения: {user['birthdate']}, {user.get('birthtime','12:00')}, {user.get('birthplace','')}

Натальная карта:
{natal_desc}

Активные транзиты:
{asp_desc}

Луна сегодня: {transits['moon']['sign']}

Обращайся к {user['name']} лично. Пиши живо и конкретно на основе реальных аспектов.
Ответь ТОЛЬКО валидным JSON без markdown:
{{"title":"заголовок (5-7 слов)","energy":<1-10>,"moon":"Луна в {transits['moon']['sign']}","summary":"общий прогноз (3-4 предложения)","career":"карьера (2-3 предложения)","love":"отношения (2 предложения)","health":"здоровье (1-2 предложения)","best_time":"лучшее время","advice":"совет дня (1 предложение)"}}"""
    try:
        resp = model.generate_content(prompt)
        text = resp.text.strip()
        if '```' in text:
            text = text.split('```')[1]
            if text.startswith('json'): text = text[4:]
        return json.loads(text.strip())
    except:
        return {
            "title":"День новых возможностей","energy":7,
            "moon":f"Луна в {transits['moon']['sign']}",
            "summary":f"Сегодня благоприятный день для {user['name']}. Планеты поддерживают ваши начинания.",
            "career":"Деловая активность на подъёме.","love":"Открытость укрепит отношения.",
            "health":"Уделите время отдыху.","best_time":"12:00–16:00","advice":"Доверяйте своей интуиции."
        }
