#!/bin/bash
# Автозапуск бота при входе в систему на macOS.
# Запустите этот файл один раз — автозапуск включится. Запустите ещё раз — выключится.
# Как работает: при входе в систему macOS открывает start.command в окне Терминала.
cd "$(dirname "$0")" || exit 1
DIR="$(pwd)"
LABEL="local.stockbot"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
DOMAIN="gui/$(id -u)"

pause() { echo; read -r -p "Нажмите Enter, чтобы закрыть… " _; }

if [ "$(uname)" != "Darwin" ]; then
  echo "Этот файл — только для macOS."
  exit 1
fi

if [ -f "$PLIST" ]; then
  launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null
  rm -f "$PLIST"
  echo "Автозапуск выключен. Уже запущенный бот продолжает работать, пока открыто его окно."
  pause
  exit 0
fi

SAFE_DIR=$(printf '%s' "$DIR" | sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g')
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST" <<PLIST_END
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/open</string>
        <string>$SAFE_DIR/start.command</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
PLIST_END

if launchctl bootstrap "$DOMAIN" "$PLIST"; then
  echo "Автозапуск включён: после включения Mac и входа в систему бот будет открываться сам."
  echo "Сейчас откроется окно с ботом (если он уже запущен, новое окно сообщит об этом)."
  echo "Чтобы выключить автозапуск, запустите этот файл ещё раз."
  echo "Если перенесёте папку бота в другое место — выключите и включите автозапуск заново."
else
  rm -f "$PLIST"
  echo "Не получилось включить автозапуск. Запасной способ: «Системные настройки» → «Основные» →"
  echo "«Объекты входа» → «+» → выберите файл start.command."
fi
pause
