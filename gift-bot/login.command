#!/bin/bash
# Вход в Telegram для бота подарков (один раз). macOS: дважды кликните по файлу.
# Если система не даёт открыть: откройте «Терминал», наберите  bash  и пробел,
# перетащите этот файл в окно и нажмите Enter.
cd "$(dirname "$0")" || exit 1
export PYTHONUTF8=1
pause() { echo; read -r -p "Нажмите Enter, чтобы закрыть… " _; }

# Ключи и данные не должны попадать в iCloud: папки с окончанием .nosync он не синхронизирует.
for d in private data; do
  if [ ! -e "$d" ]; then mkdir -p "$d.nosync" && ln -s "$d.nosync" "$d"; fi
done

if ! .venv/bin/python -c 'import telethon' 2>/dev/null; then
  echo "Устанавливаю окружение (один раз)…"
  PY=$(command -v python3.13 || command -v python3.12 || command -v python3.11 || command -v python3)
  if [ ! -e .venv ]; then "$PY" -m venv .venv.nosync && ln -s .venv.nosync .venv; fi
  .venv/bin/pip install -q -r requirements.txt || { echo "Не удалось установить зависимости."; pause; exit 1; }
fi

.venv/bin/python bot.py login
pause
