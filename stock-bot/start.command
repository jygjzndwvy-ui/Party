#!/bin/bash
# Запуск бота на macOS (12 и новее) и Linux.
#   macOS: дважды кликните по файлу. Если система не даёт открыть — откройте «Терминал»,
#          наберите  bash  и пробел, перетащите этот файл в окно и нажмите Enter.
#   Linux: bash start.command
cd "$(dirname "$0")" || exit 1
export PYTHONUTF8=1

if [ "$(uname)" = "Darwin" ]; then
  # Снимаем с папки пометку «загружено из интернета», чтобы дальше файл открывался двойным кликом.
  xattr -dr com.apple.quarantine . 2>/dev/null
  chmod +x start.command 2>/dev/null
fi

find_python() {
  local c p
  for c in python3.13 python3.12 python3.11 python3.14 python3.15 \
      /Library/Frameworks/Python.framework/Versions/3.13/bin/python3 \
      /Library/Frameworks/Python.framework/Versions/3.12/bin/python3 \
      /Library/Frameworks/Python.framework/Versions/3.11/bin/python3 \
      /Library/Frameworks/Python.framework/Versions/Current/bin/python3 \
      /opt/homebrew/bin/python3 /usr/local/bin/python3 python3; do
    p=$(command -v "$c" 2>/dev/null) || continue
    # На macOS без инструментов Xcode /usr/bin/python3 — заглушка, которая открывает окно установки.
    if [ "$p" = "/usr/bin/python3" ] && [ "$(uname)" = "Darwin" ] && ! xcode-select -p >/dev/null 2>&1; then
      continue
    fi
    if "$p" -c 'import sys; sys.exit(0 if (3, 11) <= sys.version_info[:2] <= (3, 15) else 1)' 2>/dev/null; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

pause() { echo; read -r -p "Нажмите Enter, чтобы закрыть… " _; }

if ! .venv/bin/python -c 'import sys' 2>/dev/null; then
  PY=$(find_python)
  if [ -z "$PY" ]; then
    echo
    echo "Не нашёл Python версии 3.11–3.13. Установите его:"
    echo "  1. Откройте https://www.python.org/downloads/macos/"
    echo "  2. Скачайте «macOS 64-bit universal2 installer» для Python 3.13 и установите."
    echo "  3. Запустите этот файл ещё раз."
    [ "$(uname)" = "Darwin" ] && open "https://www.python.org/downloads/macos/" 2>/dev/null
    pause
    exit 1
  fi
  echo "Первый запуск: устанавливаю необходимое, это займёт пару минут…"
  rm -rf .venv
  if ! "$PY" -m venv .venv; then
    echo "Не удалось подготовить окружение Python."
    pause
    exit 1
  fi
fi

if ! .venv/bin/python -m pip install --quiet --disable-pip-version-check -r requirements.txt; then
  echo
  echo "Не удалось установить компоненты. Проверьте интернет и запустите файл ещё раз."
  echo "Если ошибка повторяется — установите Python 3.13 с python.org и удалите папку .venv."
  pause
  exit 1
fi

# caffeinate не даёт Mac уснуть, пока работает бот (экран при этом может гаснуть).
RUN=(.venv/bin/python -m stockbot)
if command -v caffeinate >/dev/null 2>&1; then
  RUN=(caffeinate -i "${RUN[@]}")
fi

while true; do
  "${RUN[@]}"
  code=$?
  if [ "$code" -eq 0 ] || [ "$code" -eq 130 ]; then
    break                       # остановили сами (Ctrl+C)
  fi
  if [ "$code" -eq 2 ]; then    # нужна правка настроек (например, токен) — перезапуск не поможет
    pause
    exit 2
  fi
  echo
  echo "Бот остановился (код $code). Перезапуск через 10 секунд. Чтобы выйти — Ctrl+C или закройте окно."
  sleep 10 || break
done
