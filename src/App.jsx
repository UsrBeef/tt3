import { useEffect, useMemo, useState } from "react";
import "./App.css";

const TOURNAMENT_INFO = {
  name: "Spring Board Cup 2026",
  datePlace: "12 апреля 2026 • Киев",
  format: "Рапид",
  prizes: "Кубок, медали, призы от партнеров",
};

const REGISTER_URL = "https://n8lcltstat.party/webhook-test/register-player";
const PROFILE_URL = "https://n8lcltstat.party/webhook-test/register-player";

function withTimeout(ms = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  return { controller, timeoutId };
}

export default function App() {
  const [tgUser, setTgUser] = useState(null);
  const [screen, setScreen] = useState("tournament");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);

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

  async function submitRegistration() {
    if (!formData.full_name.trim() || !formData.rating.trim() || !formData.club.trim()) {
      setMessage("Заполните все поля");
      return;
    }

    setLoading(true);
    setMessage("");

    const payload = {
      telegram_user_id: tgUser?.id ?? null,
      telegram_username: tgUser?.username ?? null,
      telegram_name: telegramName,
      initData: window.Telegram?.WebApp?.initData ?? "",
      full_name: formData.full_name,
      rating: formData.rating,
      club: formData.club,
    };

    const { controller, timeoutId } = withTimeout(15000);

    try {
      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Ответ backend не является JSON");
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (data.ok) {
        setIsRegistered(true);
        setMessage(data.message || "Регистрация сохранена");
      } else {
        setMessage(data.message || "Ошибка регистрации");
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        setMessage("Таймаут запроса: backend слишком долго отвечает");
      } else {
        setMessage(`Ошибка сети при регистрации: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadPlayerProfile() {
    setLoading(true);
    setMessage("");

    const payload = {
      telegram_user_id: tgUser?.id ?? null,
      initData: window.Telegram?.WebApp?.initData ?? "",
    };

    const { controller, timeoutId } = withTimeout(15000);

    try {
      const response = await fetch(PROFILE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const rawText = await response.text();

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("Ответ backend не является JSON");
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      if (data.ok) {
        setProfile({
          full_name: data.full_name,
          rating: data.rating,
          club: data.club,
          status: data.tournament_status,
          games: data.games || [],
        });
        setScreen("profile");
      } else {
        setMessage(data.message || "Профиль не найден");
      }
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === "AbortError") {
        setMessage("Таймаут запроса при загрузке профиля");
      } else {
        setMessage(`Ошибка загрузки профиля: ${error.message}`);
      }
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
          <button className="primary" onClick={() => setScreen("register")} disabled={loading}>
            Участвовать
          </button>

          {(isRegistered || profile) && (
            <button className="secondary" onClick={loadPlayerProfile} disabled={loading}>
              Профиль игрока
            </button>
          )}
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
            {loading ? "Отправка..." : "Отправить регистрацию"}
          </button>

          {isRegistered && (
            <button className="secondary" onClick={loadPlayerProfile} disabled={loading}>
              Профиль игрока
            </button>
          )}

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
          <div className="avatar">{(telegramName[0] || "G").toUpperCase()}</div>
          <div>
            <div className="label">Tournament Mini App</div>
            <h1>{telegramName}</h1>
            <div className="muted">
              {tgUser?.username ? `@${tgUser.username}` : "Без username"}
            </div>
          </div>
        </div>

        {message && <div className="panel">{message}</div>}

        {screen === "tournament" && renderTournamentScreen()}
        {screen === "register" && renderRegisterScreen()}
        {screen === "profile" && renderProfileScreen()}
      </div>
    </div>
  );
}