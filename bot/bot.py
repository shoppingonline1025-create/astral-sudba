import os
import asyncio
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, ContextTypes

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://astral-sudba.vercel.app")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    name = user.first_name or "друг"

    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton(
            text="✨ Открыть Астральную Судьбу",
            web_app=WebAppInfo(url=WEBAPP_URL)
        )]
    ])

    await update.message.reply_text(
        f"Привет, {name}! 🌟\n\n"
        "Добро пожаловать в *Астральную Судьбу* — твой личный астрологический помощник.\n\n"
        "🗺️ Натальная карта\n"
        "🔮 Ежедневные прогнозы\n"
        "💜 Совместимость\n"
        "🌙 Энергия дня\n\n"
        "Нажми кнопку ниже, чтобы начать:",
        parse_mode="Markdown",
        reply_markup=keyboard
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "📖 *Команды бота:*\n\n"
        "/start — Открыть приложение\n"
        "/help — Помощь\n\n"
        "Всё остальное доступно в самом приложении! ✨",
        parse_mode="Markdown"
    )


def main():
    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    print("🚀 Бот запущен...")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
