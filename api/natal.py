from http.server import BaseHTTPRequestHandler
import json, sys, os
from datetime import datetime
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(__file__))
from _astro import calc_positions, geocode, sb_get_user

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def do_GET(self):
        try:
            params = parse_qs(urlparse(self.path).query)
            telegram_id = int(params.get('id', [0])[0])
            if not telegram_id:
                return self._json({"error": "id required"}, 400)

            user = sb_get_user(telegram_id)
            if not user:
                return self._json({"error": "Пользователь не найден"}, 404)

            bdate = datetime.strptime(user['birthdate'], "%Y-%m-%d")
            btime = datetime.strptime(user.get('birthtime', '12:00:00'), "%H:%M:%S")

            lat = user.get('birth_lat') or 0
            lon_c = user.get('birth_lon') or 0
            if (not lat or lat == 55.7558) and user.get('birthplace'):
                lat, lon_c = geocode(user['birthplace'])

            positions = calc_positions(bdate.year, bdate.month, bdate.day, btime.hour, btime.minute, lat, lon_c)
            self._json({
                "name": user['name'],
                "birthdate": user['birthdate'],
                "birthplace": user.get('birthplace'),
                "planets": [{"name": v['name_ru'], "sign": v['sign'], "degree": v['degree']} for v in positions.values()]
            })
        except Exception as e:
            self._json({"error": str(e)}, 500)

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')

    def _json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass
