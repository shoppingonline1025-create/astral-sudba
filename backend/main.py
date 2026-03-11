import math
import os
import json
import requests
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="АстроЛичность API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")

# ─── Астрологические константы ───────────────────────────────────────────────

ZODIAC_RU = [
    'Овен', 'Телец', 'Близнецы', 'Рак', 'Лев', 'Дева',
    'Весы', 'Скорпион', 'Стрелец', 'Козерог', 'Водолей', 'Рыбы',
]
PLANET_RU = {
    'sun': 'Солнце', 'moon': 'Луна', 'mercury': 'Меркурий',
    'venus': 'Венера', 'mars': 'Марс', 'jupiter': 'Юпитер', 'saturn': 'Сатурн',
}
ASPECT_ANGLES = {
    'conjunction': 0, 'sextile': 60, 'square': 90, 'trine': 120, 'opposition': 180,
}
ASPECT_RU = {
    'conjunction': 'Соединение', 'sextile': 'Секстиль',
    'square': 'Квадрат', 'trine': 'Трин', 'opposition': 'Оппозиция',
}

# ─── Астрорасчёты (чистый Python, алгоритмы Жана Мееуса) ─────────────────────

def _jd(year, month, day, hour=12, minute=0):
    """Юлианская дата."""
    if month <= 2:
        year -= 1
        month += 12
    A = int(year / 100)
    B = 2 - A + int(A / 4)
    return int(365.25 * (year + 4716)) + int(30.6001 * (month + 1)) + day + B - 1524.5 + (hour + minute / 60.0) / 24.0

def _norm(x):
    return x % 360

def _r(x):
    return math.radians(x)

def _sun_lon(T):
    L0 = 280.46646 + 36000.76983 * T
    M  = 357.52911 + 35999.05029 * T - 0.0001537 * T * T
    Mr = _r(_norm(M))
    C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * math.sin(Mr)
    C += (0.019993 - 0.000101 * T) * math.sin(2 * Mr)
    C += 0.000289 * math.sin(3 * Mr)
    return _norm(L0 + C)

def _moon_lon(T):
    Lp = 218.3164477 + 481267.88123421 * T
    D  = 297.8501921 + 445267.1114034  * T
    M  = 357.5291092 + 35999.0502909   * T
    Mp = 134.9633964 + 477198.8675055  * T
    F  =  93.2720950 + 483202.0175233  * T
    lon = (Lp
        + 6.288774 * math.sin(_r(_norm(Mp)))
        + 1.274027 * math.sin(_r(_norm(2*D - Mp)))
        + 0.658314 * math.sin(_r(_norm(2*D)))
        + 0.213618 * math.sin(_r(_norm(2*Mp)))
        - 0.185116 * math.sin(_r(_norm(M)))
        - 0.114332 * math.sin(_r(_norm(2*F)))
        + 0.058793 * math.sin(_r(_norm(2*D - 2*Mp)))
        + 0.057066 * math.sin(_r(_norm(2*D - M - Mp)))
        + 0.053322 * math.sin(_r(_norm(2*D + Mp)))
        + 0.045758 * math.sin(_r(_norm(2*D - M)))
        - 0.040923 * math.sin(_r(_norm(M - Mp)))
        - 0.034720 * math.sin(_r(_norm(D)))
        - 0.030383 * math.sin(_r(_norm(M + Mp)))
    )
    return _norm(lon)

# Орбитальные элементы планет на J2000.0 и их изменения за юлианский век:
# (L0, L1, a0, a1, e0, e1, i0, i1, w0, w1, Om0, Om1)
_ELEMENTS = {
    'mercury': (252.25032350, 149472.67411175, 0.38709927, 0.00000037,  0.20563593,  0.00001906,  7.00497902, -0.00594749,  77.45779628,  0.16047689, 48.33076593, -0.12534081),
    'venus':   (181.97909950,  58517.81538729, 0.72333566, 0.00000390,  0.00677672, -0.00004107,  3.39467605, -0.00078890, 131.60246718,  0.00268329, 76.67984255, -0.27769418),
    'earth':   (100.46457166,  35999.37244981, 1.00000261, 0.00000562,  0.01671123, -0.00004392, -0.00001531, -0.01294668, 102.93768193,  0.32327364,  0.0,          0.0        ),
    'mars':    (355.45332000,  19140.30268000, 1.52371034, 0.00001847,  0.09339410,  0.00007882,  1.84969142, -0.00813131, -23.94362959,  0.44441088, 49.55953891, -0.29257343),
    'jupiter': ( 34.39644051,   3034.74612775, 5.20288700,-0.00011607,  0.04838624, -0.00013253,  1.30439695, -0.00183714,  14.72847983,  0.21252668,100.47390909,  0.20469106),
    'saturn':  ( 49.95424423,   1222.49514316, 9.53667594,-0.00125060,  0.05386179, -0.00050991,  2.48599187,  0.00193609,  92.59887831, -0.41897216,113.66242448, -0.28867794),
}

def _helio_xy(name, T):
    """Гелиоцентрические эклиптические координаты (x, y)."""
    L0, L1, a0, a1, e0, e1, i0, i1, w0, w1, Om0, Om1 = _ELEMENTS[name]
    L   = _norm(L0  + L1  * T)
    a   =       a0  + a1  * T
    e   =       e0  + e1  * T
    i   = _norm(i0  + i1  * T)
    w   = _norm(w0  + w1  * T)
    Om  = _norm(Om0 + Om1 * T)
    M   = _norm(L - w)
    # Уравнение Кеплера (итерации)
    E = M
    for _ in range(10):
        E = M + math.degrees(e * math.sin(_r(E)))
    Er = _r(E)
    v = 2 * math.degrees(math.atan2(
        math.sqrt(1 + e) * math.sin(Er / 2),
        math.sqrt(1 - e) * math.cos(Er / 2),
    ))
    lh = _norm(v + w)
    d  = a * (1 - e * math.cos(Er))
    x  = d * (math.cos(_r(Om)) * math.cos(_r(lh - Om))
              - math.sin(_r(Om)) * math.sin(_r(lh - Om)) * math.cos(_r(i)))
    y  = d * (math.sin(_r(Om)) * math.cos(_r(lh - Om))
              + math.cos(_r(Om)) * math.sin(_r(lh - Om)) * math.cos(_r(i)))
    return x, y

def _planet_geocentric_lon(name, T):
    """Геоцентрическая эклиптическая долгота планеты."""
    xe, ye = _helio_xy('earth', T)
    if name == 'sun':
        return _norm(math.degrees(math.atan2(-ye, -xe)))
    xp, yp = _helio_xy(name, T)
    return _norm(math.degrees(math.atan2(yp - ye, xp - xe)))

def get_sign(lon):
    return ZODIAC_RU[int(lon / 30) % 12], round(lon % 30, 1)

def calc_positions(year, month, day, hour, minute, lat=0, lon=0):
    """Возвращает позиции планет (геоцентрические эклиптические долготы)."""
    jd = _jd(year, month, day, hour, minute)
    T  = (jd - 2451545.0) / 36525.0

    raw = {
        'sun':     _sun_lon(T),
        'moon':    _moon_lon(T),
        'mercury': _planet_geocentric_lon('mercury', T),
        'venus':   _planet_geocentric_lon('venus',   T),
        'mars':    _planet_geocentric_lon('mars',    T),
        'jupiter': _planet_geocentric_lon('jupiter', T),
        'saturn':  _planet_geocentric_lon('saturn',  T),
    }
    result = {}
    for key, lon_deg in raw.items():
        sign, deg = get_sign(lon_deg)
        result[key] = {
            'longitude': round(lon_deg, 2),
            'sign':      sign,
            'degree':    deg,
            'name_ru':   PLANET_RU[key],
        }
    return result

def find_aspects(chart1, chart2, orb=6):
    aspects = []
    for k2, d2 in chart2.items():
        for k1, d1 in chart1.items():
            diff = abs(d2['longitude'] - d1['longitude'])
            if diff > 180:
                diff = 360 - diff
            for asp, angle in ASPECT_ANGLES.items():
                if abs(diff - angle) <= orb:
                    aspects.append({
                        'planet1': PLANET_RU[k2],
                        'aspect': asp,
                        'aspect_ru': ASPECT_RU[asp],
                        'planet2': PLANET_RU[k1],
                        'orb': round(abs(diff - angle), 1),
                    })
    aspects.sort(key=lambda x: x['orb'])
    return aspects

def calc_synastry_score(aspects):
    score = 60
    for a in aspects:
        asp = a['aspect']
        weight = max(0.0, (6 - a['orb']) / 6)
        if asp in ('trine', 'sextile'):
            score += weight * 4
        elif asp == 'conjunction':
            score += weight * 2
        elif asp == 'square':
            score -= weight * 3
        elif asp == 'opposition':
            score -= weight * 2
    return max(10, min(99, round(score)))

def geocode(city):
    try:
        r = requests.get(
            f"https://nominatim.openstreetmap.org/search?q={city}&format=json&limit=1",
            headers={"User-Agent": "AstroLichnost/1.0"}, timeout=5,
        )
        data = r.json()
        if data:
            return float(data[0]['lat']), float(data[0]['lon'])
    except Exception:
        pass
    return 55.7558, 37.6173  # Москва fallback

def parse_birth(user):
    """Читает данные рождения из записи пользователя (старые и новые имена колонок)."""
    birth_date_str = user.get('birth_date') or user.get('birthdate')
    birth_time_str = user.get('birth_time') or user.get('birthtime') or '12:00'
    birth_place = user.get('birth_place') or user.get('birthplace') or ''

    bdate = datetime.strptime(birth_date_str, "%Y-%m-%d")
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            btime = datetime.strptime(str(birth_time_str)[:8], fmt)
            break
        except Exception:
            btime = datetime.strptime("12:00", "%H:%M")

    lat = user.get('birth_lat') or 0.0
    lon = user.get('birth_lon') or user.get('birth_lng') or 0.0
    if (not lat or lat == 55.7558) and birth_place:
        lat, lon = geocode(birth_place)

    return bdate, btime, birth_place, lat, lon

# ─── Supabase helpers ─────────────────────────────────────────────────────────

def _headers(service=False):
    key = SUPABASE_SERVICE_KEY if service else SUPABASE_KEY
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def sb_get(path):
    r = requests.get(f"{SUPABASE_URL}/rest/v1/{path}", headers=_headers())
    data = r.json()
    return data if isinstance(data, list) else []

def sb_post(path, data, service=False):
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=_headers(service),
        data=json.dumps(data),
    )
    result = r.json()
    if isinstance(result, list) and result:
        return result[0]
    return result

def sb_patch(path, data, service=False):
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/{path}",
        headers=_headers(service),
        data=json.dumps(data),
    )
    result = r.json()
    if isinstance(result, list) and result:
        return result[0]
    return result

def sb_delete(path, service=False):
    requests.delete(f"{SUPABASE_URL}/rest/v1/{path}", headers=_headers(service))

# ─── Тарифная логика ──────────────────────────────────────────────────────────

LIMITS = {
    'free':     {'messages': 5,  'partners': 1,  'forecast_days': 1},
    'trial':    {'messages': 30, 'partners': 5,  'forecast_days': 7},
    'pro':      {'messages': 30, 'partners': 5,  'forecast_days': 7},
    'platinum': {'messages': 80, 'partners': 10, 'forecast_days': 30},
}

FEATURES = {
    'transits_basic':  ['pro', 'platinum'],
    'transits_full':   ['platinum'],
    'progressions':    ['platinum'],
    'solar_included':  ['platinum'],
    'notifications':   ['pro', 'platinum'],
    'pdf_export':      ['platinum'],
    'sonnet_priority': ['platinum'],
}

def get_active_plan(user):
    if not user:
        return 'free'
    now = datetime.utcnow()
    trial = user.get('trial_ends_at')
    if trial:
        try:
            t = datetime.fromisoformat(trial.replace('Z', '').split('+')[0])
            if t > now:
                return 'trial'
        except Exception:
            pass
    expires = user.get('subscription_expires_at')
    if expires:
        try:
            e = datetime.fromisoformat(expires.replace('Z', '').split('+')[0])
            if e > now:
                return user.get('subscription_status', 'free')
        except Exception:
            pass
    return 'free'

# ─── Эндпоинты ────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "АстроЛичность"}


# ── Пользователь ──────────────────────────────────────────────────────────────

@app.get("/api/user")
def get_user(id: int):
    data = sb_get(f"users?telegram_id=eq.{id}&select=*")
    if not data:
        return {}
    return data[0]


class UserCreate(BaseModel):
    telegram_id: int
    name: str
    birth_date: str
    birth_time: Optional[str] = None
    birth_place: str


@app.post("/api/user")
def create_user(body: UserCreate):
    lat, lon = geocode(body.birth_place)

    # Рассчитываем знаки сразу
    sun_sign = moon_sign = None
    planets = {}
    try:
        bdate = datetime.strptime(body.birth_date, "%Y-%m-%d")
        bt_str = (body.birth_time or "12:00")[:5]
        btime = datetime.strptime(bt_str, "%H:%M")
        planets = calc_positions(
            bdate.year, bdate.month, bdate.day,
            btime.hour, btime.minute, lat, lon,
        )
        sun_sign = planets['sun']['sign']
        moon_sign = planets['moon']['sign']
    except Exception:
        pass

    trial_ends = (datetime.utcnow() + timedelta(hours=72)).isoformat()
    bt_full = (body.birth_time or "12:00")
    if len(bt_full) == 5:
        bt_full += ":00"

    user = sb_post("users", {
        "telegram_id": body.telegram_id,
        "name": body.name,
        # новые колонки
        "birth_date":  body.birth_date,
        "birth_time":  body.birth_time,
        "birth_place": body.birth_place,
        # старые колонки (для совместимости с существующими данными)
        "birthdate":   body.birth_date,
        "birthtime":   bt_full,
        "birthplace":  body.birth_place,
        "birth_lat":   lat,
        "birth_lon":   lon,
        "subscription_status":      "trial",
        "trial_ends_at":            trial_ends,
        "messages_used_this_month": 0,
    }, service=True)

    if not user or 'id' not in user:
        raise HTTPException(status_code=500, detail="Ошибка создания пользователя")

    # Сохраняем натальную карту
    if planets:
        sb_post("natal_charts", {
            "user_id":     user['id'],
            "birth_date":  body.birth_date,
            "birth_time":  body.birth_time,
            "birth_place": body.birth_place,
            "birth_lat":   lat,
            "birth_lng":   lon,
            "sun_sign":    sun_sign,
            "moon_sign":   moon_sign,
            "planets_json": planets,
        }, service=True)

    return user


@app.delete("/api/user")
def delete_user(id: int):
    data = sb_get(f"users?telegram_id=eq.{id}&select=id")
    if not data:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    sb_delete(f"users?id=eq.{data[0]['id']}", service=True)
    return {"ok": True}


# ── Натальная карта ───────────────────────────────────────────────────────────

@app.get("/api/natal")
def get_natal(id: int):
    user_data = sb_get(f"users?telegram_id=eq.{id}&select=*")
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user = user_data[0]

    # Ищем сохранённую карту
    charts = sb_get(f"natal_charts?user_id=eq.{user['id']}&select=*&limit=1")
    if charts and charts[0].get('planets_json'):
        return charts[0]

    # Рассчитываем на лету
    bdate, btime, birth_place, lat, lon = parse_birth(user)
    planets = calc_positions(
        bdate.year, bdate.month, bdate.day,
        btime.hour, btime.minute, lat, lon,
    )
    return {
        "user_id":     user['id'],
        "sun_sign":    planets['sun']['sign'],
        "moon_sign":   planets['moon']['sign'],
        "ascendant":   None,
        "planets_json": planets,
        "birth_date":  user.get('birth_date') or user.get('birthdate'),
        "birth_place": user.get('birth_place') or user.get('birthplace'),
    }


# ── Прогнозы ──────────────────────────────────────────────────────────────────

@app.get("/api/forecast")
def get_forecast(id: int, period: str = "day"):
    today = str(date.today())

    user_data = sb_get(f"users?telegram_id=eq.{id}&select=*")
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user = user_data[0]
    user_id = user['id']

    # Кэш
    cached = sb_get(
        f"forecasts_cache?user_id=eq.{user_id}"
        f"&forecast_date=eq.{today}&period=eq.{period}&select=*&limit=1"
    )
    if cached:
        return cached[0]['content']

    # Рассчитываем транзиты
    bdate, btime, _, lat, lon = parse_birth(user)
    natal = calc_positions(
        bdate.year, bdate.month, bdate.day,
        btime.hour, btime.minute, lat, lon,
    )
    today_dt = date.today()
    transits = calc_positions(today_dt.year, today_dt.month, today_dt.day, 12, 0, lat, lon)
    aspects = find_aspects(natal, transits)[:6]

    moon_sign = transits['moon']['sign']
    name = user.get('name', '')
    good = sum(1 for a in aspects if a['aspect'] in ('trine', 'sextile'))
    bad  = sum(1 for a in aspects if a['aspect'] in ('square', 'opposition'))
    energy = min(10, max(4, 6 + good - bad))

    forecast = {
        "title":     f"День {name}",
        "energy":    energy,
        "moon":      f"Луна в {moon_sign}",
        "summary":   f"Солнце в {natal['sun']['sign']}, Луна в {moon_sign}. День подходит для вдумчивых решений.",
        "career":    "Обратите внимание на детали в рабочих вопросах.",
        "love":      "Время для открытого диалога с близкими.",
        "health":    "Уделите внимание отдыху и восстановлению.",
        "best_time": "11:00–15:00",
        "advice":    "Доверяйте своей интуиции.",
    }

    # Если есть Gemini — генерируем настоящий прогноз
    if GEMINI_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_KEY)
            gemini = genai.GenerativeModel("gemini-1.5-flash")

            natal_desc = "\n".join(
                f"  {v['name_ru']}: {v['degree']}° {v['sign']}" for v in natal.values()
            )
            asp_desc = "\n".join(
                f"  {a['planet1']} {a['aspect_ru']} {a['planet2']} (орб {a['orb']}°)"
                for a in aspects
            ) or "  Нет выраженных транзитов"

            prompt = (
                f"Ты опытный астролог. Составь персональный прогноз на сегодня ({today}).\n"
                f"Имя: {name}\n"
                f"Натальная карта:\n{natal_desc}\n"
                f"Активные транзиты:\n{asp_desc}\n"
                f"Луна в {moon_sign}\n\n"
                f"Ответь ТОЛЬКО валидным JSON (без markdown, без ```):\n"
                f'{{"title":"...","energy":<1-10>,"moon":"Луна в {moon_sign}",'
                f'"summary":"...","career":"...","love":"...","health":"...",'
                f'"best_time":"...","advice":"..."}}'
            )
            text = gemini.generate_content(prompt).text.strip()
            if "```" in text:
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            forecast = json.loads(text.strip())
        except Exception:
            pass  # используем базовую заглушку

    # Сохраняем в кэш
    try:
        sb_post("forecasts_cache", {
            "user_id":       user_id,
            "forecast_date": today,
            "period":        period,
            "content":       forecast,
        }, service=True)
    except Exception:
        pass

    return forecast


@app.delete("/api/forecast")
def clear_forecast(id: int):
    user_data = sb_get(f"users?telegram_id=eq.{id}&select=id")
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    sb_delete(f"forecasts_cache?user_id=eq.{user_data[0]['id']}", service=True)
    return {"ok": True}


# ── Синастрия ─────────────────────────────────────────────────────────────────

class PartnerCreate(BaseModel):
    name: str
    birth_date: str
    birth_time: Optional[str] = None
    birth_place: Optional[str] = None


@app.post("/api/synastry")
def add_partner(id: int, body: PartnerCreate):
    user_data = sb_get(f"users?telegram_id=eq.{id}&select=*")
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user = user_data[0]

    lat_p, lon_p = geocode(body.birth_place) if body.birth_place else (55.7558, 37.6173)

    # Карта пользователя
    bdate_u, btime_u, _, lat_u, lon_u = parse_birth(user)
    user_planets = calc_positions(
        bdate_u.year, bdate_u.month, bdate_u.day,
        btime_u.hour, btime_u.minute, lat_u, lon_u,
    )

    # Карта партнёра
    try:
        bdate_p = datetime.strptime(body.birth_date, "%Y-%m-%d")
        bt_str = (body.birth_time or "12:00")[:5]
        btime_p = datetime.strptime(bt_str, "%H:%M")
        partner_planets = calc_positions(
            bdate_p.year, bdate_p.month, bdate_p.day,
            btime_p.hour, btime_p.minute, lat_p, lon_p,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка в данных партнёра: {e}")

    aspects = find_aspects(user_planets, partner_planets)
    score = calc_synastry_score(aspects)

    if score >= 75:
        summary   = "Отличная совместимость! Ваши карты образуют гармоничный союз с сильными поддерживающими аспектами."
        strengths = "Трины и секстили между ключевыми планетами создают взаимопонимание и общие жизненные ценности."
        challenges = "Следите за балансом между личным пространством и близостью."
    elif score >= 55:
        summary   = "Хорошая совместимость с потенциалом для роста. Есть как гармоничные, так и напряжённые аспекты."
        strengths = "Взаимное притяжение и интерес друг к другу, общие ценности в ключевых вопросах."
        challenges = "Некоторые аспекты требуют осознанной работы и готовности к компромиссу."
    else:
        summary   = "Непростая, но яркая совместимость. Напряжение между картами может стать источником роста."
        strengths = "Динамичное взаимодействие, способность мотивировать и вдохновлять друг друга."
        challenges = "Различия в подходах требуют терпения, открытости и готовности к диалогу."

    synastry = {
        "score":      score,
        "summary":    summary,
        "strengths":  strengths,
        "challenges": challenges,
        "aspects":    aspects[:8],
    }

    partner = sb_post("partners", {
        "user_id":     user['id'],
        "name":        body.name,
        "birth_date":  body.birth_date,
        "birth_time":  body.birth_time,
        "birth_place": body.birth_place,
        "synastry_json": synastry,
    }, service=True)

    if not partner or 'id' not in partner:
        raise HTTPException(status_code=500, detail="Ошибка сохранения партнёра")

    return partner


@app.get("/api/synastry")
def get_compatibility(id: int, partner: int):
    data = sb_get(f"partners?id=eq.{partner}&select=*")
    if not data:
        raise HTTPException(status_code=404, detail="Партнёр не найден")
    return data[0].get('synastry_json', {})


# ── Чат с астрологом ──────────────────────────────────────────────────────────

@app.get("/api/astrologer")
def get_chat_history(id: int):
    user_data = sb_get(f"users?telegram_id=eq.{id}&select=id")
    if not user_data:
        return []
    user_id = user_data[0]['id']
    messages = sb_get(
        f"chat_history?user_id=eq.{user_id}"
        f"&select=role,content,created_at&order=created_at.asc&limit=20"
    )
    return messages


class ChatMessage(BaseModel):
    id: int  # telegram_id
    message: str


@app.post("/api/astrologer")
def send_message(body: ChatMessage):
    user_data = sb_get(f"users?telegram_id=eq.{body.id}&select=*")
    if not user_data:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    user = user_data[0]
    user_id = user['id']

    plan = get_active_plan(user)
    limit = LIMITS.get(plan, LIMITS['free'])['messages']
    used = user.get('messages_used_this_month', 0)

    if used >= limit:
        raise HTTPException(status_code=403, detail="Лимит сообщений исчерпан")

    # Сохраняем сообщение пользователя
    sb_post("chat_history", {
        "user_id": user_id, "role": "user", "content": body.message,
    }, service=True)

    reply = (
        "Астролог временно недоступен — подключение к AI будет добавлено в ближайшее время. ✨\n"
        "Пока можете изучить свою натальную карту или прогнозы."
    )

    # Сохраняем ответ и обновляем счётчик
    sb_post("chat_history", {
        "user_id": user_id, "role": "assistant", "content": reply,
    }, service=True)
    sb_patch(f"users?id=eq.{user_id}", {
        "messages_used_this_month": used + 1,
    }, service=True)

    return {"reply": reply}


# ── Проверка доступа ──────────────────────────────────────────────────────────

@app.get("/api/access")
def check_access(id: int, feature: str):
    user_data = sb_get(f"users?telegram_id=eq.{id}&select=*")
    if not user_data:
        return {"allowed": False}
    user = user_data[0]
    plan = get_active_plan(user)

    if feature in FEATURES:
        return {"allowed": plan in FEATURES[feature], "plan": plan}

    if feature == "chat_message":
        used  = user.get('messages_used_this_month', 0)
        limit = LIMITS[plan]['messages']
        return {"allowed": used < limit, "used": used, "limit": limit, "plan": plan}

    if feature.startswith("purchase_"):
        product = feature.replace("purchase_", "")
        purchases = sb_get(
            f"one_time_purchases?user_id=eq.{user['id']}"
            f"&product_type=eq.{product}&status=eq.completed&select=id&limit=1"
        )
        return {"allowed": bool(purchases), "plan": plan}

    return {"allowed": True, "plan": plan}
