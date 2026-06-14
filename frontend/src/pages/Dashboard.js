import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { statsAPI } from '../services/api';
import { PawPrint, Building2, Users, FileText, Heart, TrendingUp } from 'lucide-react';

const ANIMAL_EMOJIS = { dog: '', cat: '', bird: '', rabbit: '', other: '' };

export default function Dashboard() {
  const { user, isAdmin, isShelterOwner } = useAuth();
  const [stats, setStats] = useState(null);
  const [shelterStats, setShelterStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    statsAPI.general().then(r => setStats(r.data)).catch(() => {});
    if (isShelterOwner) statsAPI.shelter().then(r => setShelterStats(r.data)).catch(() => {});
  }, [isShelterOwner]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Вітаємо, {user?.name?.split(' ')[0]}! </h1>
        <p className="page-subtitle">
          {isAdmin ? 'Панель адміністратора — повний контроль над платформою' :
           isShelterOwner ? 'Панель власника притулку — керуйте тваринами та заявками' :
           'Ваша панель — знайдіть улюбленця та подайте заявку'}
        </p>
      </div>

      {/* General stats */}
      {stats && (
        <div className="card-grid card-grid-4" style={{ marginBottom: 28 }}>
          {[
            { icon: '', label: 'Всього тварин', value: stats.total_animals, bg: '#FEF3C7', color: '#B45309' },
            { icon: '', label: 'Доступні', value: stats.available_animals, bg: '#D1FAE5', color: '#065F46' },
            { icon: '', label: 'Прилаштовані', value: stats.adopted_animals, bg: '#DBEAFE', color: '#1E40AF' },
            { icon: '', label: 'Притулків', value: stats.total_shelters, bg: '#EDE9FE', color: '#5B21B6' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-icon" style={{ background: s.bg, fontSize: '1.5rem' }}>{s.icon}</div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shelter owner stats */}
      {isShelterOwner && shelterStats && (
        <>
          <h2 style={{ fontFamily: 'Unbounded', fontSize: '1.1rem', marginBottom: 16 }}>Мій притулок</h2>
          <div className="card-grid card-grid-4" style={{ marginBottom: 28 }}>
            {[
              { label: 'Тварин у притулку', value: shelterStats.total_animals, emoji: '' },
              { label: 'Доступні', value: shelterStats.available_animals, emoji: '' },
              { label: 'Прилаштовані', value: shelterStats.adopted_animals, emoji: '' },
              { label: 'Нові заявки', value: shelterStats.pending_applications, emoji: '' },
            ].map(s => (
              <div key={s.label} className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>{s.emoji}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {shelterStats.recent_applications?.length > 0 && (
            <div className="card" style={{ marginBottom: 28 }}>
              <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 16 }}>Останні заявки</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shelterStats.recent_applications.map(app => (
                  <div key={app.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: 10, background: 'var(--bg)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{app.user_name}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Тварина: {app.animal_name}</div>
                    </div>
                    <span className={`badge badge-${app.status}`}>{app.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick actions */}
      <h2 style={{ fontFamily: 'Unbounded', fontSize: '1.1rem', marginBottom: 16 }}>Швидкі дії</h2>
      <div className="card-grid card-grid-3">
        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => navigate('/animals')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}></div>
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '1rem', marginBottom: 6 }}>Переглянути тварин</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Знайдіть собі або друзям пухнастого друга</p>
        </div>

        {!isAdmin && !isShelterOwner && (
          <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => navigate('/applications')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}></div>
            <h3 style={{ fontFamily: 'Unbounded', fontSize: '1rem', marginBottom: 6 }}>Мої заявки</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Відстежуйте статус своїх заявок</p>
          </div>
        )}

        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => navigate('/ai')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}></div>
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '1rem', marginBottom: 6 }}>AI Помічник</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Запитайте про догляд за тваринами</p>
        </div>

        <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => navigate('/shelters')}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}></div>
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '1rem', marginBottom: 6 }}>Притулки</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Знайдіть притулки поруч з вами</p>
        </div>

        {(isShelterOwner || isAdmin) && (
          <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => navigate('/shelter/manage')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}></div>
            <h3 style={{ fontFamily: 'Unbounded', fontSize: '1rem', marginBottom: 6 }}>Керування притулком</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Додавайте тварин та обробляйте заявки</p>
          </div>
        )}

        {isAdmin && (
          <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => navigate('/admin/stats')}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}></div>
            <h3 style={{ fontFamily: 'Unbounded', fontSize: '1rem', marginBottom: 6 }}>Статистика</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Аналіз даних платформи</p>
          </div>
        )}
      </div>
    </div>
  );
}
