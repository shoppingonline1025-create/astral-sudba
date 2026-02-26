from http.server import BaseHTTPRequestHandler
import json
import sys
import os
from datetime import datetime

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from _astro import calc_positions, geocode, sb_get_user

def cors_headers(h):
    h.send_header('Access-Control-Allow-Origin', '*')
    h.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        cors_headers(self)
        self.end_headers()

    def do_GET(self):
        try:
            path_parts = self.path.split('/')
            telegram_id = int([p for p in path_parts if p.isdigit()][-1])

            user = sb_get_user(telegram_id)
            if not user:
                return self._send_json({"error": "Пользователь не найден"}, 404)

            bdate = datetime.strptime(user['birthdate'], "%Y-%m-%d")
            btime = datetime.strptime(user.get('birthtime', '12:00:00'), "%H:%M:%S")

            lat = user.get('birth_lat') or 0
            lon_coord = user.get('birth_lon') or 0
            if (not lat or lat == 55.7558) and user.get('birthplace'):
                lat, lon_coord = geocode(user['birthplace'])

            positions = calc_positions(bdate.year, bdate.month, bdate.day, btime.hour, btime.minute, lat, lon_coord)

            self._send_json({
                "name": user['name'],
                "birthdate": user['birthdate'],
                "birthplace": user.get('birthplace'),
                "planets": [
                    {"name": v['name_ru'], "sign": v['sign'], "degree": v['degree']}
                    for v in positions.values()
                ]
            })
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
