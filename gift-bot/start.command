#!/bin/bash
# Запуск бота подарков: работает, пока открыто это окно. macOS: дважды кликните по файлу.
# Остановить: /stop в «Избранном» Telegram или Ctrl+C в этом окне.
cd "$(dirname "$0")" || exit 1
export PYTHONUTF8=1
DIR="$(pwd)"
pause() { echo; read -r -p "Нажмите Enter, чтобы закрыть… " _; }

if [ ! -f private/gift.session ]; then
  echo "Сначала войдите в Telegram: дважды кликните по login.command."
  pause
  exit 1
fi
if pgrep -f "$DIR/bot.py run" >/dev/null; then
  echo "Бот уже работает в другом окне. Второй запуск не нужен."
  pause
  exit 0
fi

"$DIR/.venv/bin/python" "$DIR/bot.py" run
pause
