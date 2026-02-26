from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Астральная Судьба API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class BirthDataRequest(BaseModel):
    name: str
    birthdate: str        # "YYYY-MM-DD"
    birthtime: Optional[str] = "12:00"
    birthplace: Optional[str] = "Moscow"
    lat: Optional[float] = 55.7558
    lon: Optional[float] = 37.6173


class CompatibilityRequest(BaseModel):
    sign1: str
    sign2: str


ZODIAC_SIGNS = [
    "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
    "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"
]

COMPATIBILITY_TABLE = {
    ("Овен", "Лев"): 95, ("Овен", "Стрелец"): 90, ("Овен", "Близнецы"): 85,
    ("Телец", "Дева"): 95, ("Телец", "Козерог"): 92, ("Телец", "Рак"): 88,
    ("Близнецы", "Весы"): 93, ("Близнецы", "Водолей"): 88,
    ("Рак", "Скорпион"): 94, ("Рак", "Рыбы"): 92,
    ("Лев", "Стрелец"): 91, ("Лев", "Овен"): 95,
    ("Дева", "Козерог"): 93, ("Дева", "Телец"): 95,
    ("Весы", "Водолей"): 91, ("Весы", "Близнецы"): 93,
    ("Скорпион", "Рыбы"): 94, ("Скорпион", "Рак"): 94,
    ("Стрелец", "Овен"): 90, ("Стрелец", "Лев"): 91,
    ("Козерог", "Телец"): 92, ("Козерог", "Дева"): 93,
    ("Водолей", "Близнецы"): 88, ("Водолей", "Весы"): 91,
    ("Рыбы", "Рак"): 92, ("Рыбы", "Скорпион"): 94,
}


def get_compatibility_score(sign1: str, sign2: str) -> int:
    key = (sign1, sign2)
    rev_key = (sign2, sign1)
    return COMPATIBILITY_TABLE.get(key, COMPATIBILITY_TABLE.get(rev_key, 65))


def get_sun_sign(birthdate: str) -> str:
    try:
        d = datetime.strptime(birthdate, "%Y-%m-%d")
        month, day = d.month, d.day
        if (month == 3 and day >= 21) or (month == 4 and day <= 19): return "Овен"
        if (month == 4 and day >= 20) or (month == 5 and day <= 20): return "Телец"
        if (month == 5 and day >= 21) or (month == 6 and day <= 20): return "Близнецы"
        if (month == 6 and day >= 21) or (month == 7 and day <= 22): return "Рак"
        if (month == 7 and day >= 23) or (month == 8 and day <= 22): return "Лев"
        if (month == 8 and day >= 23) or (month == 9 and day <= 22): return "Дева"
        if (month == 9 and day >= 23) or (month == 10 and day <= 22): return "Весы"
        if (month == 10 and day >= 23) or (month == 11 and day <= 21): return "Скорпион"
        if (month == 11 and day >= 22) or (month == 12 and day <= 21): return "Стрелец"
        if (month == 12 and day >= 22) or (month == 1 and day <= 19): return "Козерог"
        if (month == 1 and day >= 20) or (month == 2 and day <= 18): return "Водолей"
        return "Рыбы"
    except Exception:
        return "Неизвестно"


@app.get("/")
def root():
    return {"status": "ok", "app": "Астральная Судьба"}


@app.post("/api/natal-chart")
def get_natal_chart(data: BirthDataRequest):
    sun_sign = get_sun_sign(data.birthdate)
    # Базовые данные (позже подключим Flatlib для точных расчётов)
    return {
        "name": data.name,
        "birthdate": data.birthdate,
        "sun_sign": sun_sign,
        "planets": [
            {"name": "Солнце", "sign": sun_sign, "icon": "☀️"},
            {"name": "Луна", "sign": "Телец", "icon": "🌙"},
            {"name": "Асцендент", "sign": "Лев", "icon": "⬆️"},
            {"name": "Меркурий", "sign": "Рыбы", "icon": "☿"},
            {"name": "Венера", "sign": "Козерог", "icon": "♀️"},
            {"name": "Марс", "sign": "Скорпион", "icon": "♂️"},
        ]
    }


@app.post("/api/compatibility")
def get_compatibility(data: CompatibilityRequest):
    score = get_compatibility_score(data.sign1, data.sign2)
    if score >= 90:
        level = "Отличная пара! ✨"
        desc = "Сильное притяжение и мощная энергетика. Вы созданы друг для друга."
    elif score >= 75:
        level = "Хорошая совместимость 💜"
        desc = "Много общего, хорошее взаимопонимание. Отношения будут гармоничными."
    else:
        level = "Нужна работа над отношениями 🔮"
        desc = "Есть различия, но с взаимным уважением всё возможно."
    return {"sign1": data.sign1, "sign2": data.sign2, "score": score, "level": level, "description": desc}


@app.get("/api/forecast/today")
def get_today_forecast():
    from datetime import date
    today = date.today()
    return {
        "date": str(today),
        "energy": 8,
        "moon": "Луна в Стрельце ♐",
        "title": "Прогноз на сегодня",
        "text": "Эмоциональный день. Вы будете полны энергии — отличное время для новых начинаний.",
        "moments": ["❤️ Удача в делах", "💜 Гармония в отношениях"],
        "activity_time": "12:00 – 16:00",
    }


@app.get("/api/energy/today")
def get_today_energy():
    return {
        "moon": "Луна в Стрельце ♐",
        "lunar_day": 14,
        "lunar_phase": "Полнолуние 🌕",
        "energy": 9,
        "best_time": "11:00 – 15:00",
        "advice": "Смело идите к своим целям!",
        "spheres": {
            "work": 9,
            "love": 8,
            "health": 7,
            "finance": 8,
        }
    }
