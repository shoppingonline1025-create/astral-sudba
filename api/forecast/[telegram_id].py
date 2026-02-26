from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import date, datetime
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from _astro import (
    calc_positions, find_aspects, geocode,
    sb_get_user, sb_get_forecast, sb_save_forecast, generate_forecast
)

def cors_headers(handler):
    handler.send_header('Access-Control-Allow-Origin', '*')
    handler.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
    handler.send_header('Access-Control-Allow-Headers', 'Content-Type')

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        cors_headers(self)
        self.end_headers()

    def do_GET(self):
        try:
            # Получаем telegram_id из пути
            path_parts = self.path.split('/')
            telegram_id = int([p for p in path_parts if p.isdigit()][-1])

            today = str(date.today())

            # Проверяем кэш
            cached = sb_get_forecast(telegram_id, today)
            if cached:
                return self._send_json(cached['content'])

            # Получаем пользователя
            user = sb_get_user(telegram_id)
            if not user:
                return self._send_json({"error": "Пользователь не найден"}, 404)

            # Парсим дату/время
            bdate = datetime.strptime(user['birthdate'], "%Y-%m-%d")
            btime = datetime.strptime(user.get('birthtime', '12:00:00'), "%H:%M:%S")

            # Геокодируем
            lat = user.get('birth_lat') or 0
            lon_coord = user.get('birth_lon') or 0
            if (not lat or lat == 55.7558) and user.get('birthplace'):
                lat, lon_coord = geocode(user['birthplace'])

            # Рассчитываем карты
            natal = calc_positions(bdate.year, bdate.month, bdate.day, btime.hour, btime.minute, lat, lon_coord)
            today_dt = date.today()
            transits = calc_positions(today_dt.year, today_dt.month, today_dt.day, 12, 0, lat, lon_coord)
            aspects = find_aspects(natal, transits)

            # Генерируем прогноз через Gemini
            forecast = generate_forecast(user, natal, transits, aspects, today)

            # Сохраняем в кэш
            sb_save_forecast(telegram_id, today, forecast)

            self._send_json(forecast)

        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        cors_headers(self)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass
