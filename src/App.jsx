import { useEffect, useMemo, useState } from "react";
import "./App.css";

export default function App() {
  const [tgUser, setTgUser] = useState(null);
  const [startParam, setStartParam] = useState("");
  const [status, setStatus] = useState("Готово");
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready?.();
      tg.expand?.();

      setTgUser(tg.initDataUnsafe?.user ?? null);
      setStartParam(tg.initDataUnsafe?.start_param ?? "");

      const tp = tg.themeParams ?? {};
      if (tp.bg_color) {
        document.documentElement.style.setProperty("--tg-bg", tp.bg_color);
      }
      if (tp.text_color) {
        document.documentElement.style.setProperty("--tg-text", tp.text_color);
      }
      if (tp.button_color) {
        document.documentElement.style.setProperty("--tg-button", tp.button_color);
      }
      if (tp.button_text_color) {
        document.documentElement.style.setProperty("--tg-button-text", tp.button_text_color);
      }
    } else {
      setStatus("Тестовый режим вне Telegram");
    }
  }, []);

  const playerName = useMemo(() => {
    if (!tgUser) return "Гость";
    return [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
  }, [tgUser]);

  async function handleRegister() {
    setLoading(true);
    setStatus("Отправка регистрации...");

    try {
      // Здесь позже вставишь webhook n8n
      await new Promise((r) => setTimeout(r, 700));
      setStatus("Регистрация отправлена");
    } catch (e) {
      console.error(e);
      setStatus("Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  async function handlePlayerInfo() {
    setLoading(true);
    setStatus("Загрузка информации...");

    try {
      // Здесь позже вставишь webhook n8n
      await new Promise((r) => setTimeout(r, 700));

      setPlayerInfo({
        tournament: "Spring Board Cup",
        player: playerName,
        round: "3",
        table: "4",
        opponent: "Иван Петров",
        checkin: "Подтвержден",
      });

      setStatus("Информация загружена");
    } catch (e) {
      console.error(e);
      setStatus("Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div className="avatar">
            {(playerName[0] || "G").toUpperCase()}
          </div>
          <div>
            <div className="label">Tournament Mini App</div>
            <h1>{playerName}</h1>
            <div className="muted">
              {tgUser?.username ? `@${tgUser.username}` : "Без username"}
            </div>
          </div>
        </div>

        <div className="panel">
          <div><b>Статус:</b> {status}</div>
          <div><b>Telegram ID:</b> {tgUser?.id ?? "нет"}</div>
          <div><b>Параметр запуска:</b> {startParam || "не передан"}</div>
        </div>

        <div className="actions">
          <button className="primary" onClick={handleRegister} disabled={loading}>
            Регистрация
          </button>
          <button className="secondary" onClick={handlePlayerInfo} disabled={loading}>
            Информация об игроке
          </button>
        </div>

        <div className="panel">
          <div className="sectionTitle">Интеграция с n8n</div>
          <ul>
            <li>Кнопка регистрации → webhook n8n</li>
            <li>Кнопка информации → webhook n8n</li>
            <li>Позже можно передавать telegram_user_id и initData</li>
          </ul>
        </div>

        {playerInfo && (
          <div className="panel">
            <div className="sectionTitle">Карточка игрока</div>
            <div className="row"><span>Турнир</span><b>{playerInfo.tournament}</b></div>
            <div className="row"><span>Игрок</span><b>{playerInfo.player}</b></div>
            <div className="row"><span>Раунд</span><b>{playerInfo.round}</b></div>
            <div className="row"><span>Стол</span><b>{playerInfo.table}</b></div>
            <div className="row"><span>Соперник</span><b>{playerInfo.opponent}</b></div>
            <div className="row"><span>Check-in</span><b>{playerInfo.checkin}</b></div>
          </div>
        )}
      </div>
    </div>
  );
}