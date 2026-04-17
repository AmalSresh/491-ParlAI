import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// ── PAGE CONTEXT DETECTOR ─────────────────────────────────────────────────────
// Reads current route to give the AI context about what page the user is on
function getPageContext(pathname) {
  if (pathname.includes('/nfl'))    return { sport: 'NFL',     emoji: '🏈', description: 'NFL player props and season projections' };
  if (pathname.includes('/mlb'))    return { sport: 'MLB',     emoji: '⚾', description: 'MLB live game betting with moneyline and totals' };
  if (pathname.includes('/nba'))    return { sport: 'NBA',     emoji: '🏀', description: 'NBA matchups and game betting' };
  if (pathname.includes('/hockey')) return { sport: 'NHL',     emoji: '🏒', description: 'NHL hockey live game betting' };
  if (pathname.includes('/soccer')) return { sport: 'Soccer',  emoji: '⚽', description: 'Soccer match betting' };
  if (pathname.includes('/bets'))   return { sport: 'My Bets', emoji: '📋', description: 'viewing your placed bets' };
  if (pathname.includes('/dashboard')) return { sport: 'Dashboard', emoji: '📊', description: 'account dashboard' };
  return { sport: 'Home', emoji: '🏠', description: 'the ParlAI home page' };
}

// ── SMART RULE-BASED RESPONSES ────────────────────────────────────────────────
// Handles common questions without needing an API key
// Will be replaced with Azure OpenAI once your team sets it up
function getSmartResponse(message, pageContext) {
  const msg = message.toLowerCase();

  // Greetings
  if (msg.match(/^(hi|hello|hey|sup|yo|what's up|whats up)/)) {
    return `Hey! 👋 I'm ParlAI Assistant — your AI betting guide. I can see you're on the **${pageContext.sport}** page.\n\nI can help you with:\n• How to place bets\n• What betting markets mean\n• Betting strategy tips\n• Reading odds\n\nWhat would you like to know?`;
  }

  // How to place a bet
  if (msg.includes('how') && (msg.includes('bet') || msg.includes('place') || msg.includes('wager'))) {
    if (pageContext.sport === 'NFL') {
      return `Here's how to bet on the **NFL page** 🏈:\n\n1. Browse player prop cards\n2. Click **↑ More** if you think the player will exceed the projected line\n3. Click **↓ Less** if you think they'll fall short\n4. Enter your stake amount in the bet modal\n5. Review the payout (odds ×1.9)\n6. Click **Confirm Bet** ✅\n\nYour balance updates automatically after each bet!`;
    }
    if (pageContext.sport === 'MLB') {
      return `Here's how to bet on the **MLB page** ⚾:\n\n1. Find a game you want to bet on\n2. Choose a market:\n   • **Moneyline** — pick which team wins\n   • **Total Runs** — bet Over/Under 8.5 runs\n3. Click the odds button to open the bet modal\n4. Enter your stake and confirm\n\nNote: You can only place **one bet per game**!`;
    }
    if (pageContext.sport === 'NHL') {
      return `Here's how to bet on the **NHL page** 🏒:\n\n1. Find a live or upcoming game\n2. Choose:\n   • **Moneyline** — pick the winner\n   • **Total Goals** — Over/Under 5.5 goals\n3. Enter your stake in the bet panel\n4. Click **Place Bet** to confirm\n\nBalance resets on refresh — backend integration coming soon!`;
    }
    return `To place a bet on ParlAI:\n\n1. Navigate to any sport page (NFL, MLB, NHL, etc.)\n2. Find a game or player prop you like\n3. Click the odds button\n4. Enter your stake amount\n5. Confirm your bet\n\nYou start with **$1,000 virtual balance**. Which sport are you betting on?`;
  }

  // Moneyline explanation
  if (msg.includes('moneyline') || msg.includes('money line') || (msg.includes('ml') && msg.includes('mean'))) {
    return `**Moneyline** 🎯 is the simplest bet — you're just picking which team wins.\n\n**How to read odds:**\n• ×1.5 means bet $10 → win $15 total\n• ×2.0 means bet $10 → win $20 total\n• Higher odds = bigger payout but less likely to win\n\nOn ParlAI, the favorite usually has lower odds (like ×1.40) and the underdog has higher odds (like ×2.60).`;
  }

  // Over/Under explanation
  if (msg.includes('over') || msg.includes('under') || msg.includes('total') || msg.includes('o/u')) {
    return `**Over/Under (Totals)** 📊 is betting on the combined score of a game.\n\n**Example for MLB:**\n• Line is set at **8.5 runs**\n• Bet **Over** → you win if both teams score 9+ runs total\n• Bet **Under** → you win if both teams score 8 or fewer runs total\n\nThe .5 (hook) ensures there's always a winner — no ties!\n\nBoth Over and Under pay ×1.90 on ParlAI.`;
  }

  // Spread explanation
  if (msg.includes('spread') || msg.includes('point spread') || msg.includes('handicap')) {
    return `**Point Spread** 📏 is betting on the margin of victory.\n\n**Example:**\n• Lakers -5.5 vs Celtics +5.5\n• Bet Lakers -5.5 → Lakers must win by 6+ points\n• Bet Celtics +5.5 → Celtics must lose by 5 or fewer (or win)\n\nSpreads level the playing field between favorites and underdogs. Currently ParlAI offers spreads on some sports!`;
  }

  // Odds explanation
  if (msg.includes('odds') && (msg.includes('what') || msg.includes('mean') || msg.includes('read') || msg.includes('understand'))) {
    return `**How to read odds on ParlAI** 📖\n\nWe use **decimal odds** (European format):\n\n• **×1.90** = bet $10, total return is $19 (profit $9)\n• **×2.00** = bet $10, total return is $20 (profit $10)\n• **×1.50** = bet $10, total return is $15 (profit $5)\n\n**Formula:** Stake × Odds = Total Payout\n\nHigher odds = bigger risk + bigger reward!\n\nThe standard odds on ParlAI are **×1.90** (~-110 in American odds).`;
  }

  // Balance question
  if (msg.includes('balance') || msg.includes('money') || msg.includes('credits') || msg.includes('how much')) {
    return `💰 You start with **$1,000 virtual balance** when you create an account.\n\nYour balance:\n• Goes down when you place a bet (stake deducted)\n• Goes up when your bet wins (payout added)\n• Can be tracked in your **Dashboard**\n\nThis is all virtual currency — no real money involved! It's just for fun and practice.`;
  }

  // NFL specific
  if (msg.includes('nfl') || msg.includes('football') || (msg.includes('prop') && !msg.includes('promo'))) {
    return `**NFL Betting on ParlAI** 🏈\n\nWe offer **2026 season projections** based on real 2025 stats:\n\n• **Pass Yards** — how many yards will a QB throw?\n• **Rush Yards** — how many yards will a RB rush?\n• **Rec Yards** — how many yards will a WR receive?\n• **TDs** — touchdown totals\n• **Receptions** — catch totals\n\nEach card shows the **projected line** and the **2025 actual stat** for reference.\n\nUse filters to browse by position or stat type!`;
  }

  // MLB specific
  if (msg.includes('mlb') || msg.includes('baseball')) {
    return `**MLB Betting on ParlAI** ⚾\n\nLive games powered by ESPN with two markets:\n\n• **Moneyline** — pick the winning team\n• **Total Runs (O/U 8.5)** — bet if combined runs go over or under\n\n**Tips:**\n• Check which teams are home vs away\n• Look at the current score for live games\n• You can only bet once per game\n\nGames refresh automatically — or hit the ↻ button!`;
  }

  // NHL specific
  if (msg.includes('nhl') || msg.includes('hockey')) {
    return `**NHL Betting on ParlAI** 🏒\n\nLive scores from ESPN with:\n• **Moneyline** — pick the winner\n• **Total Goals (O/U 5.5)** — over or under 5.5 goals\n\nFilter by Live, Upcoming, or Finished games using the tabs at the top!`;
  }

  // NBA specific
  if (msg.includes('nba') || msg.includes('basketball')) {
    return `**NBA Betting on ParlAI** 🏀\n\nThis week's NBA matchups are pulled live from ESPN.\n\nYou can view:\n• Live scores and game status\n• Upcoming matchups\n• Historical results\n\nBetting markets are being integrated — check back soon!`;
  }

  // What sports are available
  if (msg.includes('sport') || msg.includes('available') || msg.includes('what can') || msg.includes('which sport')) {
    return `**Available Sports on ParlAI** 🏆\n\n• 🏈 **NFL** — Player props & season projections\n• ⚾ **MLB** — Live game betting\n• 🏀 **NBA** — Weekly matchups\n• 🏒 **NHL** — Live game betting\n• ⚽ **Soccer** — Match betting\n\nMore sports coming soon! Use the sidebar to navigate between sports.`;
  }

  // Strategy/tips
  if (msg.includes('tip') || msg.includes('strateg') || msg.includes('advice') || msg.includes('help me win') || msg.includes('how to win')) {
    return `**Betting Tips** 💡\n\n1. **Manage your balance** — never bet more than 10% on a single game\n2. **Shop the lines** — compare different markets before betting\n3. **Home advantage matters** — home teams win ~55% in major sports\n4. **Check recent form** — look at the 2025 actual stats vs the projection\n5. **Don't chase losses** — stick to your strategy\n\n⚠️ Remember — this is virtual currency! Practice smart betting habits.`;
  }

  // What is ParlAI
  if (msg.includes('what is parlai') || msg.includes('about') || msg.includes('parlai')) {
    return `**ParlAI** 🤖 is an AI-powered sports betting simulation app.\n\n**Key features:**\n• Virtual $1,000 starting balance\n• Real sports data from ESPN & Sleeper API\n• Multiple sports — NFL, MLB, NBA, NHL, Soccer\n• Projected odds and prop lines\n• Track your bets in My Bets\n\nIt's designed to practice sports betting without any real money risk!`;
  }

  // Page specific context
  if (msg.includes('this page') || msg.includes('current page') || msg.includes('here') || msg.includes('what am i')) {
    return `You're currently on the **${pageContext.sport} page** ${pageContext.emoji}\n\nThis page shows ${pageContext.description}.\n\nWhat would you like to know about betting here?`;
  }

  // Thank you
  if (msg.match(/thank|thanks|thx|ty|appreciate/)) {
    return `You're welcome! 😊 Good luck with your bets! If you have any more questions, I'm always here. 🎯`;
  }

  // Default fallback
  return `I can help you with:\n\n• **How to place bets** — just ask "how do I bet?"\n• **Explaining odds** — "what do odds mean?"\n• **Betting markets** — "what is moneyline?" or "what is over/under?"\n• **Sport-specific help** — "how does NFL betting work?"\n• **Tips & strategy** — "give me betting tips"\n\nYou're currently on the **${pageContext.sport}** page ${pageContext.emoji}. What would you like to know?`;
}

// ── SUGGESTED QUESTIONS ───────────────────────────────────────────────────────
function getSuggestions(pageContext) {
  const base = ['How do I place a bet?', 'What does moneyline mean?', 'Explain over/under'];
  const sportSpecific = {
    'NFL':  ['How does NFL prop betting work?', 'What are pass yard props?'],
    'MLB':  ['How do I bet on MLB games?', 'What is the run total line?'],
    'NHL':  ['How do I bet on hockey?', 'What is total goals betting?'],
    'NBA':  ['What NBA games are available?', 'How does NBA betting work?'],
    'Soccer': ['How does soccer betting work?', 'What is a 3-way bet?'],
  };
  return [...(sportSpecific[pageContext.sport] || []), ...base].slice(0, 4);
}

// ── MAIN CHAT WIDGET ──────────────────────────────────────────────────────────
export default function ChatWidget() {
  const location = useLocation();
  const [isOpen,   setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const pageContext = getPageContext(location.pathname);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      window.setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Send welcome message when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: `Hi! 👋 I'm **ParlAI Assistant** — your AI betting guide.\n\nI can see you're on the **${pageContext.sport}** page ${pageContext.emoji}. I can help you understand betting markets, how to place bets, and give you tips!\n\nWhat can I help you with?`,
        id: Date.now(),
      }]);
    }
  }, [isOpen]);

  // Update context message when page changes
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `📍 I see you navigated to the **${pageContext.sport}** page ${pageContext.emoji}. Ask me anything about betting here!`,
        id: Date.now(),
      }]);
    }
  }, [location.pathname]);

  async function handleSend(text) {
    const messageText = text || input.trim();
    if (!messageText) return;

    const userMsg = { role: 'user', text: messageText, id: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay for natural feel
    await new Promise(r => window.setTimeout(r, 600 + Math.random() * 400));

    const response = getSmartResponse(messageText, pageContext);
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'assistant', text: response, id: Date.now() + 1 }]);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Format message text (bold, line breaks)
  function formatText(text) {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) =>
            j % 2 === 1
              ? <strong key={j} style={{ color: '#00f6ff' }}>{part}</strong>
              : part
          )}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      );
    });
  }

  const suggestions = getSuggestions(pageContext);

  return (
    <>
      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatPulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.08); }
        }
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-4px); opacity: 1; }
        }
        .chat-bubble-btn:hover { animation: chatPulse 0.6s ease; }
        .chat-msg-user { animation: chatSlideUp 0.3s ease; }
        .chat-msg-ai   { animation: chatSlideUp 0.3s ease; }
      `}</style>

      {/* Floating bubble button */}
      <button
        className="chat-bubble-btn"
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000,
          width: 56, height: 56, borderRadius: '50%',
          background: isOpen ? '#0d0f14' : 'linear-gradient(135deg, #00f6ff, #0080c6)',
          border: '2px solid #00f6ff',
          boxShadow: '0 0 24px rgba(0,246,255,0.35)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', transition: 'all 0.3s',
          color: isOpen ? '#00f6ff' : '#000',
        }}
        title={isOpen ? 'Close chat' : 'Open ParlAI Assistant'}
      >
        {isOpen ? '✕' : '🤖'}
      </button>

      {/* Unread dot */}
      {!isOpen && (
        <div style={{
          position: 'fixed', bottom: '3.8rem', right: '2rem', zIndex: 1001,
          width: 10, height: 10, borderRadius: '50%',
          background: '#00c853', border: '2px solid #0d0f14',
        }} />
      )}

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: 'fixed', bottom: '5.5rem', right: '2rem', zIndex: 999,
          width: 360, height: 520,
          background: '#0d0f14',
          border: '1px solid rgba(0,246,255,0.3)',
          borderRadius: '18px',
          boxShadow: '0 0 40px rgba(0,246,255,0.15), 0 20px 60px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideUp 0.3s ease',
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.2rem',
            background: 'linear-gradient(135deg, #111520, #0d0f14)',
            borderBottom: '1px solid rgba(0,246,255,0.15)',
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #00f6ff22, #0080c622)',
              border: '1px solid rgba(0,246,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem',
            }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f3f4f6' }}>ParlAI Assistant</div>
              <div style={{ fontSize: '0.68rem', color: '#00c853', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00c853', display: 'inline-block' }} />
                Online · {pageContext.sport} page {pageContext.emoji}
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: 4 }}
            >✕</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-ai'}
                style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,246,255,0.1)', border: '1px solid rgba(0,246,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', marginRight: 6, marginTop: 2, flexShrink: 0 }}>🤖</div>
                )}
                <div style={{
                  maxWidth: '80%',
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #00f6ff, #0080c6)' : '#151820',
                  color: msg.role === 'user' ? '#000' : '#f3f4f6',
                  padding: '0.6rem 0.9rem',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  fontSize: '0.82rem', lineHeight: 1.55,
                  border: msg.role === 'assistant' ? '1px solid #1f2430' : 'none',
                }}>
                  {formatText(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,246,255,0.1)', border: '1px solid rgba(0,246,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>🤖</div>
                <div style={{ background: '#151820', border: '1px solid #1f2430', borderRadius: '14px 14px 14px 4px', padding: '0.6rem 0.9rem', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#00f6ff', animation: `typingDot 1.2s ease ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 1rem 0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {suggestions.map(s => (
                <button key={s} onClick={() => handleSend(s)}
                  style={{
                    padding: '0.3rem 0.7rem', borderRadius: '20px', cursor: 'pointer',
                    background: 'rgba(0,246,255,0.06)', border: '1px solid rgba(0,246,255,0.2)',
                    color: '#00f6ff', fontSize: '0.72rem', fontWeight: 500,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,246,255,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,246,255,0.06)'}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: '0.75rem 1rem',
            borderTop: '1px solid rgba(0,246,255,0.1)',
            display: 'flex', gap: '0.5rem', alignItems: 'center',
            background: '#0d0f14',
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me about betting..."
              style={{
                flex: 1, background: '#151820', border: '1px solid #1f2430',
                borderRadius: '10px', padding: '0.55rem 0.9rem',
                color: '#f3f4f6', fontSize: '0.83rem', outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#00f6ff'}
              onBlur={e  => e.target.style.borderColor = '#1f2430'}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              style={{
                width: 36, height: 36, borderRadius: '10px', cursor: input.trim() ? 'pointer' : 'not-allowed',
                background: input.trim() ? '#00f6ff' : '#1f2430',
                border: 'none', color: input.trim() ? '#000' : '#6b7494',
                fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', flexShrink: 0,
              }}
            >↑</button>
          </div>
        </div>
      )}
    </>
  );
}