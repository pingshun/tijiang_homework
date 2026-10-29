from datetime import date, datetime, time, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
import random
from pathlib import Path
from threading import Thread
import time as time_module

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
PAPERS_FILE = DATA / "papers.json"


def read_json(path, fallback):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return fallback


def write_json(path, value):
    DATA.mkdir(exist_ok=True)
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    temporary.replace(path)


def get_papers():
    return read_json(PAPERS_FILE, {})


def create_paper(paper_date, seed=None):
    seed = seed if seed is not None else random.SystemRandom().randrange(1 << 63)
    rng = random.Random(seed)
    questions = []
    multiplication = rng.sample(
        [(left, right) for left in range(1, 10) for right in range(1, left + 1)], 10
    )
    for number, (left, right) in enumerate(multiplication, start=1):
        questions.append({
            "number": number,
            "section": "乘法题",
            "operation": "×",
            "text": f"{left} × {right} = ______",
            "answer": str(left * right),
        })

    addition = rng.sample(
        [(left, right) for left in range(1, 20) for right in range(left, 21 - left)], 15
    )
    subtraction = rng.sample(
        [(left, right) for left in range(2, 21) for right in range(1, left)], 15
    )
    mixed = [(left, right, "+") for left, right in addition]
    mixed.extend((left, right, "−") for left, right in subtraction)
    rng.shuffle(mixed)
    for number, (left, right, operation) in enumerate(mixed, start=11):
        answer = left + right if operation == "+" else left - right
        questions.append({
            "number": number,
            "section": "加减法题",
            "operation": operation,
            "text": f"{left} {operation} {right} = ______",
            "answer": str(answer),
        })

    return {
        "date": paper_date,
        "created_at": datetime.now().isoformat(timespec="minutes"),
        "questions": questions,
        "seed": seed,
    }


def save_paper(paper):
    papers = get_papers()
    papers[paper["date"]] = paper
    write_json(PAPERS_FILE, papers)
    return paper


def ensure_paper(paper_date):
    papers = get_papers()
    paper = papers.get(paper_date)
    if not paper or not is_valid_paper(paper):
        return save_paper(create_paper(paper_date))
    return papers[paper_date]


def is_valid_paper(paper):
    questions = paper.get("questions", [])
    return (
        len(questions) == 40
        and sum(question.get("operation") == "×" for question in questions) == 10
        and sum(question.get("operation") == "+" for question in questions) == 15
        and sum(question.get("operation") == "−" for question in questions) == 15
    )


def scheduler():
    while True:
        tomorrow = datetime.combine(date.today() + timedelta(days=1), time.min)
        time_module.sleep(max(1, (tomorrow - datetime.now()).total_seconds()))
        ensure_paper(date.today().isoformat())


class Handler(BaseHTTPRequestHandler):
    def send_json(self, value, status=200):
        body = json.dumps(value, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get("Content-Length", "0"))
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            page_path = ROOT / "index.html"
            content_type = "text/html; charset=utf-8"
        elif self.path in ("/worksheet", "/worksheet.html"):
            page_path = ROOT / "worksheet.html"
            content_type = "text/html; charset=utf-8"
        elif self.path == "/assets/tijiang-icon.png":
            page_path = ROOT / "assets" / "tijiang-icon.png"
            content_type = "image/png"
        elif self.path == "/api/papers/today":
            self.send_json(ensure_paper(date.today().isoformat()))
            return
        else:
            self.send_json({"error": "接口不存在"}, 404)
            return

        body = page_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format_string, *args):
        print(f"[{self.log_date_time_string()}] {format_string % args}")


def main():
    import argparse

    parser = argparse.ArgumentParser(description="每日小学数学试卷生成器")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()

    DATA.mkdir(exist_ok=True)
    ensure_paper(date.today().isoformat())
    Thread(target=scheduler, daemon=True).start()
    server = ThreadingHTTPServer((args.host, args.port), Handler)
    print(f"试卷生成器已启动：http://{args.host}:{args.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
