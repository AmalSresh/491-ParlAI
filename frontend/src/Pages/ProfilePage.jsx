import React, { useMemo, useState } from "react";

export default function ProfilePage() {
  const user = useMemo(
    () => ({
      name: "Rafaan Hyder",
      username: "rafaan",
      tier: "Silver",
      memberSince: "2026",
      balance: 124.75,
      bonus: 20.0,
      winRate: 0.54,
      totalWagered: 840.25,
      netProfit: 72.4,
    }),
    []
  );

  const [activeTab, setActiveTab] = useState("activity");

  const activity = useMemo(
    () => [
      {
        id: "a1",
        title: "Warriors vs Lakers",
        subtitle: "Moneyline • GSW",
        amount: -10.0,
        status: "Settled",
        time: "Today • 11:04 AM",
      },
      {
        id: "a2",
        title: "Chelsea vs Arsenal",
        subtitle: "Over 2.5 Goals",
        amount: +18.5,
        status: "Won",
        time: "Yesterday • 7:22 PM",
      },
      {
        id: "a3",
        title: "NFL Sunday Parlay",
        subtitle: "3-leg • +420",
        amount: -5.0,
        status: "Lost",
        time: "Feb 10 • 3:11 PM",
      },
    ],
    []
  );

  const formatMoney = (n) =>
    n.toLocaleString(undefined, { style: "currency", currency: "USD" });

  const profitPill = (n) => (n >= 0 ? "pill pillGood" : "pill pillBad");

  return (
    <div className="page">
  <style>{styles}</style>

  <aside className="adColumn leftAd">
    Ad Space
  </aside>

  <div className="mainContent">

      <header className="topbar">
        <div className="brand">
          <div className="logo" aria-hidden />
          <div className="brandText">
            <div className="brandName">SPORTSBOOK</div>
            <div className="brandSub">Profile</div>
          </div>
        </div>

        <div className="topActions">
          <button className="btn btnGhost" type="button">
            Support
          </button>
          <button className="btn btnSolid" type="button">
            Log out
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="heroCard">
          <div className="avatar" aria-hidden>
            <span className="avatarText">
              {user.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase()}
            </span>
          </div>

          <div className="heroInfo">
            <div className="nameRow">
              <h1 className="name">{user.name}</h1>
              <span className="chip">{user.tier} Tier</span>
            </div>
            <div className="meta">
              <span className="muted">@{user.username}</span>
              <span className="dot" />
              <span className="muted">Member since {user.memberSince}</span>
            </div>

            <div className="quickRow">
              <div className="moneyBox">
                <div className="moneyLabel">Balance</div>
                <div className="moneyValue">{formatMoney(user.balance)}</div>
              </div>
              <div className="moneyBox">
                <div className="moneyLabel">Bonus</div>
                <div className="moneyValue">{formatMoney(user.bonus)}</div>
              </div>

              <div className="ctaRow">
                <button className="btn btnSolid" type="button">
                  Deposit
                </button>
                <button className="btn btnOutline" type="button">
                  Withdraw
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="grid">
        <section className="panel">
          <div className="panelHeader">
            <h2 className="panelTitle">Performance</h2>
            <span className={profitPill(user.netProfit)}>
              {user.netProfit >= 0 ? "Net +" : "Net "}
              {formatMoney(user.netProfit)}
            </span>
          </div>

          <div className="stats">
            <Stat label="Win rate" value={`${Math.round(user.winRate * 100)}%`} />
            <Stat label="Total wagered" value={formatMoney(user.totalWagered)} />
            <Stat label="Tier" value={user.tier} />
          </div>

          <div className="divider" />

          <div className="sectionTitle">Quick actions</div>
          <div className="actionsGrid">
            <ActionCard title="Account" desc="Update info, password, 2FA" />
            <ActionCard title="Limits" desc="Deposit & wager limits" />
            <ActionCard title="Payment Methods" desc="Cards, bank, payout" />
            <ActionCard title="Notifications" desc="Odds alerts & promos" />
          </div>
        </section>

        <section className="panel">
          <div className="tabs">
            <Tab active={activeTab === "activity"} onClick={() => setActiveTab("activity")}>
              Recent activity
            </Tab>
            <Tab active={activeTab === "rewards"} onClick={() => setActiveTab("rewards")}>
              Rewards
            </Tab>
            <Tab active={activeTab === "settings"} onClick={() => setActiveTab("settings")}>
              Settings
            </Tab>
          </div>

          {activeTab === "activity" && (
            <div className="list">
              {activity.map((a) => (
                <div key={a.id} className="listRow">
                  <div className="listLeft">
                    <div className="listTitle">{a.title}</div>
                    <div className="listSub">
                      <span className="muted">{a.subtitle}</span>
                      <span className="dot sm" />
                      <span className="muted">{a.status}</span>
                      <span className="dot sm" />
                      <span className="muted">{a.time}</span>
                    </div>
                  </div>

                  <div className="listRight">
                    <div className={a.amount >= 0 ? "amt good" : "amt bad"}>
                      {a.amount >= 0 ? "+" : "-"}
                      {formatMoney(Math.abs(a.amount))}
                    </div>
                    <button className="btn btnTiny" type="button">
                      Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="empty">
              <div className="emptyTitle">Rewards (stub)</div>
              <p className="muted">
                Later you can show tier progress, points, promos, and rewards history.
              </p>
              <div className="rewardCard">
                <div>
                  <div className="rewardLabel">Tier Progress</div>
                  <div className="rewardValue">Silver → Gold</div>
                </div>
                <div className="bar">
                  <div className="barFill" style={{ width: "42%" }} />
                </div>
                <div className="muted small">42% complete</div>
              </div>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="empty">
              <div className="emptyTitle">Settings (stub)</div>
              <p className="muted">Later wire this to real forms.</p>

              <div className="form">
                <label className="field">
                  <div className="label">Display name</div>
                  <input className="input" defaultValue={user.name} />
                </label>

                <label className="field">
                  <div className="label">Username</div>
                  <input className="input" defaultValue={`@${user.username}`} />
                </label>

                <button className="btn btnSolid" type="button">
                  Save changes
                </button>
              </div>
            </div>
          )}
        </section>
       </main>
    </div>

    <aside className="adColumn rightAd">
      Ad Space
    </aside>
  </div>
);
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <div className="statLabel">{label}</div>
      <div className="statValue">{value}</div>
    </div>
  );
}

function ActionCard({ title, desc }) {
  return (
    <button className="actionCard" type="button">
      <div className="actionTitle">{title}</div>
      <div className="actionDesc">{desc}</div>
    </button>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button className={active ? "tab tabActive" : "tab"} type="button" onClick={onClick}>
      {children}
    </button>
  );
}

const styles = `
  :root{
    --bg:#0b0b0b;
    --text:#fff;
    --muted:rgba(255,255,255,.65);
    --line:rgba(255,255,255,.12);
    --line2:rgba(255,255,255,.18);
    --shadow: 0 10px 30px rgba(0,0,0,.45);
    --radius:18px;
  }

  *{ box-sizing:border-box; }
  body{ background: var(--bg); margin:0; }

  .page{
  min-height:100vh;
  color:var(--text);

  background: radial-gradient(1200px 800px at 20% -10%, rgba(0, 246, 255, 0.06), transparent 55%),
              radial-gradient(900px 600px at 90% 10%, rgba(0, 246, 255, 0.04), transparent 60%),
              var(--bg);

  display: grid;
  grid-template-columns: 150px 1fr 150px;
  gap: 20px;

  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

.mainContent{
  width: min(1440px, 100%);
  margin: 0 auto;
  padding: 24px 18px;
}

.adColumn{
  flex: 0 0 140px; /* fixed thin width */
  width: 140px;
  padding-top: 40px;

  background: rgba(1, 13, 20, 0.7); /* subtle dark blue */
  border-left: 1px solid rgba(0, 246, 255, 0.08);
  border-right: 1px solid rgba(0, 246, 255, 0.08);

  color: rgba(255,255,255,.35);
  text-align: center;
  font-size: 14px;
}

.leftAd{
  border-left: none;
}

.rightAd{
  border-right: none;
}

  .topbar{
    display:flex;
    align-items:center;
    justify-content:space-between;
    gap:12px;
    max-width: 1150px;
    margin: 0 auto;
    padding: 10px 2px 18px;
  }

  .brand{ display:flex; align-items:center; gap:12px; }
  .logo{
    width:38px; height:38px;
    border-radius: 12px;
    border: 1px solid var(--line2);
    background: linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,0));
  }
  .brandName{ font-weight:800; letter-spacing:.08em; font-size:12px; }
  .brandSub{ font-size:12px; color:var(--muted); margin-top:2px; }
  .topActions{ display:flex; gap:10px; }

  .hero{ max-width:1150px; margin: 0 auto 16px; }
  .heroCard{
  display:flex;
  gap:16px;
  padding:16px;
  border-radius: var(--radius);

  background:
    radial-gradient(800px 420px at 80% -20%, rgba(0,246,255,0.10), transparent 60%),
    var(--bg-blue);

  border: 1px solid rgba(0,246,255,0.15);

  box-shadow:
    0 12px 28px rgba(0,0,0,0.55),
    inset 0 0 0 1px rgba(0,246,255,0.06);
}

  .avatar{
    width:78px; height:78px;
    border-radius: 22px;
    border: 1px solid var(--line2);
    background: rgba(255,255,255,.08);
    display:flex; align-items:center; justify-content:center;
    flex: 0 0 auto;
  }
  .avatarText{ font-weight:900; letter-spacing:.06em; }

  .heroInfo{ flex:1; min-width:0; }
  .nameRow{ display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .name{ margin:0; font-size:24px; line-height:1.1; letter-spacing:-.02em; }
  .chip{
    font-size:12px;
    padding: 6px 10px;
    border-radius: 999px;
    border:1px solid var(--line2);
    background: rgba(0,0,0,.25);
  }
  .meta{ margin-top:6px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }

  .dot{ width:4px; height:4px; border-radius:999px; background: rgba(255,255,255,.35); display:inline-block; }
  .dot.sm{ width:3px; height:3px; }
  .muted{ color: var(--muted); }
  .small{ font-size:12px; }

  .quickRow{ margin-top:14px; display:flex; gap:12px; align-items:stretch; flex-wrap:wrap; }

  .moneyBox{
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: rgba(0,0,0,.25);
    min-width: 160px;
  }
  .moneyLabel{ font-size:12px; color:var(--muted); }
  .moneyValue{ font-size:18px; font-weight:800; margin-top:4px; }

  .ctaRow{ margin-left:auto; display:flex; gap:10px; align-items:center; flex-wrap:wrap; }

  .btn{
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(0, 246, 255, 0.25);
  background: transparent;
  color: var(--text-light);
  cursor:pointer;
  font-weight:700;
  font-size:13px;
  transition: all 0.2s ease;
}
  .btn:hover{
  border-color: rgba(0, 246, 255, 0.55);
  box-shadow: 0 0 10px rgba(0, 246, 255, 0.25);
}
  .btnSolid{
  background: var(--accent);
  color: #000;
  border-color: var(--accent);
}
  .btnSolid:hover{ filter: brightness(.95); }
  .btnOutline{
  background: transparent;
  color: var(--text-light);
  border: 1px solid rgba(0, 246, 255, 0.35);
}
  .btnGhost,
.btnTiny{
  background: rgba(1, 13, 20, 0.9); /* your dark blue */
  border: 1px solid rgba(0, 246, 255, 0.18);
  color: var(--text-light);
}

  .grid{
    max-width:1150px;
    margin: 0 auto;
    display:grid;
    grid-template-columns: 1.1fr .9fr;
    gap: 14px;
  }
  @media (max-width: 980px){
    .grid{ grid-template-columns: 1fr; }
    .ctaRow{ margin-left:0; }
    .moneyBox{ flex: 1 1 160px; }
  }

  .panel{
  border-radius: var(--radius);
  background: var(--bg-blue); /* #010D14 */
  border: 1px solid rgba(0, 246, 255, 0.12);
  padding: 14px;
  box-shadow:
    0 12px 28px rgba(0,0,0,0.55),
    inset 0 0 0 1px rgba(0,246,255,0.06);
  overflow: hidden;
}
  .panelHeader{ display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom: 10px; }
  .panelTitle{
  margin: 0;
  font-size: 14px;
  letter-spacing: .06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.85); /* keep */
}

  .pill{
    font-size:12px;
    padding: 6px 10px;
    border-radius: 999px;
    border:1px solid var(--line2);
    background: rgba(0,0,0,.25);
  }

  .stats{ display:grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  @media (max-width: 520px){ .stats{ grid-template-columns: 1fr; } }
  .stat{ border: 1px solid var(--line); border-radius: 14px; padding: 12px; background: rgba(0,0,0,.22); }
  .statLabel{ font-size:12px; color:var(--muted); }
  .statValue{ margin-top:6px; font-weight:900; font-size: 18px; }

  .divider{ height:1px; background: var(--line); margin: 14px 0; }
  .sectionTitle{ font-size: 12px; text-transform: uppercase; letter-spacing: .10em; color: rgba(255,255,255,.75); margin-bottom: 10px; }

  .actionsGrid{ display:grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  @media (max-width: 520px){ .actionsGrid{ grid-template-columns: 1fr; } }
  .actionCard{
    text-align:left;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: rgba(0,0,0,.22);
    padding: 12px;
    cursor:pointer;
    color: var(--text);
  }
  .actionCard:hover{ border-color: rgba(255,255,255,.24); }
  .actionTitle{ font-weight:900; }
  .actionDesc{ margin-top:6px; color:var(--muted); font-size:12px; line-height:1.35; }

  .tabs{
    display:flex; gap:8px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--line);
    margin-bottom: 10px;
    flex-wrap:wrap;
  }
  .tab{
    padding: 9px 12px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgba(0,0,0,.18);
    color: rgba(255,255,255,.85);
    cursor:pointer;
    font-weight:800;
    font-size: 12px;
  }
  .tabActive{ background:#fff; color:#000; border-color:#fff; }

  .list{ display:flex; flex-direction:column; gap:10px; }
  .listRow{
    display:flex; gap:12px;
    align-items:center; justify-content:space-between;
    border:1px solid var(--line);
    background: rgba(0,0,0,.22);
    border-radius: 14px;
    padding: 12px;
  }
  .listTitle{ font-weight:900; }
  .listSub{ margin-top:6px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  .listRight{ display:flex; align-items:flex-end; gap:10px; flex-direction:column; flex: 0 0 auto; }
  .amt{ font-weight:1000; font-size: 14px; letter-spacing:.02em; }

  .empty{ padding: 8px 2px; }
  .emptyTitle{ font-weight:1000; font-size: 16px; }

  .rewardCard{
    margin-top: 12px;
    border:1px solid var(--line);
    border-radius: 14px;
    padding: 12px;
    background: rgba(0,0,0,.22);
    display:flex; flex-direction:column; gap:10px;
  }
  .rewardLabel{ color: var(--muted); font-size:12px; }
  .rewardValue{ font-weight:1000; font-size: 16px; margin-top: 4px; }
  .bar{
    height: 10px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: rgba(255,255,255,.06);
    overflow:hidden;
  }
  .barFill{
  height: 100%;
  background: var(--accent);
  box-shadow: 0 0 10px rgba(0, 246, 255, 0.35);
}

  .form{ margin-top: 12px; display:flex; flex-direction:column; gap:10px; }
  .field{ display:flex; flex-direction:column; gap:6px; }
  .label{ font-size:12px; color: var(--muted); }
 .input{
  border-radius: 12px;
  border: 1px solid rgba(0, 246, 255, 0.18);
  background: #000;              
  padding: 10px 12px;
  color: var(--text-light);
  outline: none;
}

.input:focus{
  border-color: rgba(0, 246, 255, 0.55);
  box-shadow: 0 0 10px rgba(0, 246, 255, 0.20);
}
`;
