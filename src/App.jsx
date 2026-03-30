import { useEffect, useMemo, useState } from "react";
import "./App.css";

const TOURNAMENT_INFO = {
  name: "Spring Board Cup 2026",
  datePlace: "12 апреля 2026 • Киев",
  format: "Рапид",
  prizes: "1 место — кубок, медали, призы от партнеров",
};

export default function App() {
  const [tgUser, setTgUser] = useState(null);
  const [startParam, setStartParam] = useState("");
  const [status, setStatus] = useState("Готово");
  const [loading, setLoading] = useState(false);

  const [screen, setScreen] = useState("tournament");
  // tournament | register | profile

  const [formData, setFormData] = useState({
    full_name: "",
    rating: "",
    club: "",
  });

  const [profile, setProfile] = useState(null);

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

  const telegramName = useMemo(() => {
    if (!tgUser) return "Гость";
    return [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
  }, [tgUser]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openRegisterForm() {
    setScreen("register");
    setStatus("Заполните форму регистрации");
  }

  async function submitRegistration() {
    if (!formData.full_name.trim() || !formData.rating.trim() || !formData.club.trim()) {
      setStatus("Заполните все поля");
      return;
    }

    setLoading(true);
    setStatus("Отправка регистрации...");

    try {
      const response = await fetch("https://n8lcltstat.party/webhook/register-player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_user_id: tgUser?.id ?? null,
          telegram_username: tgUser?.username ?? null,
          telegram_name: telegramName,
          start_param: startParam,
          initData: window.Telegram?.WebApp?.initData ?? "",
          full_name: formData.full_name,
          rating: formData.rating,
          club: formData.club,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setStatus(data.message || "Регистрация успешна");
        await loadPlayerProfile();
      } else {
        setStatus(data.message || "Ошибка регистрации");
      }
    } catch (error) {
      console.error(error);
      setStatus("Ошибка сети при регистрации");
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayerProfile() {
    setLoading(true);
    setStatus("Загрузка профиля...");

    try {
      const response = await fetch("https://YOUR-N8N-DOMAIN/webhook/get-player-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          telegram_user_id: tgUser?.id ?? null,
          initData: window.Telegram?.WebApp?.initData ?? "",
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setProfile({
          full_name: data.full_name,
          rating: data.rating,
          club: data.club,
          status: data.tournament_status,
          games: data.games || [],
        });
        setScreen("profile");
        setStatus("Профиль загружен");
      } else {
        setStatus(data.message || "Игрок не найден");
      }
    } catch (error) {
      console.error(error);
      setStatus("Ошибка загрузки профиля");
    } finally {
      setLoading(false);
    }
  }

  function renderTournamentScreen() {
    return (
      <>
        <div className="panel">
          <div className="sectionTitle">О турнире</div>
          <div className="row"><span>Название</span><b>{TOURNAMENT_INFO.name}</b></div>
          <div className="row"><span>Дата / место</span><b>{TOURNAMENT_INFO.datePlace}</b></div>
          <div className="row"><span>Формат</span><b>{TOURNAMENT_INFO.format}</b></div>
          <div className="row"><span>Призы</span><b>{TOURNAMENT_INFO.prizes}</b></div>
        </div>

        <div className="actions">
          <button className="primary" onClick={openRegisterForm} disabled={loading}>
            Участвовать
          </button>
          <button className="secondary" onClick={loadPlayerProfile} disabled={loading}>
            Мой профиль
          </button>
        </div>
      </>
    );
  }

  function renderRegisterScreen() {
    return (
      <>
        <div className="panel">
          <div className="sectionTitle">Регистрация игрока</div>

          <label className="fieldLabel">ФИО</label>
          <input
            className="input"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            placeholder="Введите ФИО"
          />

          <label className="fieldLabel">Рейтинг</label>
          <input
            className="input"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            placeholder="Введите рейтинг"
          />

          <label className="fieldLabel">Клуб</label>
          <input
            className="input"
            name="club"
            value={formData.club}
            onChange={handleChange}
            placeholder="Введите клуб"
          />
        </div>

        <div className="actions">
          <button className="primary" onClick={submitRegistration} disabled={loading}>
            Отправить регистрацию
          </button>
          <button className="secondary" onClick={() => setScreen("tournament")} disabled={loading}>
            Назад
          </button>
        </div>
      </>
    );
  }

  function renderProfileScreen() {
    return (
      <>
        <div className="panel">
          <div className="sectionTitle">Профиль игрока</div>
          <div className="row"><span>ФИО</span><b>{profile?.full_name || "-"}</b></div>
          <div className="row"><span>Рейтинг</span><b>{profile?.rating || "-"}</b></div>
          <div className="row"><span>Клуб</span><b>{profile?.club || "-"}</b></div>
          <div className="row"><span>Статус в турнире</span><b>{profile?.status || "-"}</b></div>
        </div>

        <div className="panel">
          <div className="sectionTitle">История партий</div>
          {profile?.games?.length ? (
            profile.games.map((game, index) => (
              <div className="gameCard" key={index}>
                <div><b>Раунд:</b> {game.round}</div>
                <div><b>Соперник:</b> {game.opponent}</div>
                <div><b>Результат:</b> {game.result}</div>
              </div>
            ))
          ) : (
            <div className="muted">Партий пока нет</div>
          )}
        </div>

        <div className="actions">
          <button className="secondary" onClick={() => setScreen("tournament")} disabled={loading}>
            Назад к турниру
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <div className="header">
          <div className="avatar">
            {(telegramName[0] || "G").toUpperCase()}
          </div>
          <div>
            <div className="label">Tournament Mini App</div>
            <h1>{telegramName}</h1>
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

        {screen === "tournament" && renderTournamentScreen()}
        {screen === "register" && renderRegisterScreen()}
        {screen === "profile" && renderProfileScreen()}
      </div>
    </div>
  );
}