import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Send, Bot, User } from 'lucide-react';

const SUGGESTIONS = [
  ' Як доглядати за новим собакою?',
  ' Що їсть кошеня до 3 місяців?',
  ' Які щеплення потрібні кішці?',
  ' Як підготувати дім до нового улюбленця?',
  ' Як допомогти безпритульній тварині?',
  ' Коли стерилізувати тварину?',
];

export default function AIAssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Вітаю!  Я AI-помічник платформи CarePaw. Я можу допомогти вам з питаннями про тварин, їх догляд, усиновлення та роботу притулків. Про що хочете дізнатися?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);

    try {
      const history = messages.filter(m => m.role !== 'system').slice(-8);
      const r = await aiAPI.chat({ message: msg, history, user_id: user?.id });
      setMessages(prev => [...prev, { role: 'assistant', content: r.data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Виникла помилка. Спробуйте ще раз.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> AI Помічник</h1>
        <p className="page-subtitle">Ваш розумний консультант з питань тварин та притулків</p>
      </div>

      <div className="card" style={{ height: 'calc(100vh - 220px)', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                background: m.role === 'user' ? 'var(--primary)' : 'var(--secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
              }}>
                {m.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`chat-bubble ${m.role === 'user' ? 'user' : 'ai'}`}
                style={{ whiteSpace: 'pre-wrap' }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <Bot size={16} />
              </div>
              <div className="chat-bubble ai">
                <span>Думаю</span>
                <span style={{ animation: 'blink 1s infinite' }}>...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTIONS.map(s => (
              <button key={s} className="btn btn-ghost btn-sm" style={{ fontSize: '0.8rem' }} onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            className="form-control"
            placeholder="Запитайте про тварин..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim() || loading} style={{ flexShrink: 0 }}>
            <Send size={18} />
          </button>
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.2 } }`}</style>
    </div>
  );
}
