import React, { useEffect, useState } from 'react';
import { statsAPI } from '../services/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#FF6B35', '#2D6A4F', '#FFB347', '#6366F1', '#EC4899', '#14B8A6'];
const SPECIES_UA = { dog: 'Собаки', cat: 'Коти', bird: 'Птахи', rabbit: 'Кролики', other: 'Інші' };
const STATUS_UA = { available: 'Доступні', pending: 'Очікують', adopted: 'Прилаштовані', medical_care: 'Лікування', reserved: 'Зарезервовані' };
const APP_STATUS_UA = { pending: 'Очікують', reviewing: 'Розглядаються', approved: 'Схвалені', rejected: 'Відхилені', cancelled: 'Скасовані' };

export default function AdminStatsPage() {
  const [data, setData] = useState(null);
  const [general, setGeneral] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([statsAPI.admin(), statsAPI.general()])
      .then(([a, g]) => { setData(a.data); setGeneral(g.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  const speciesData = data?.bySpecies?.map(s => ({ name: SPECIES_UA[s.species] || s.species, value: parseInt(s.count) })) || [];
  const statusData = data?.byStatus?.map(s => ({ name: STATUS_UA[s.status] || s.status, value: parseInt(s.count) })) || [];
  const appStatusData = data?.appsByStatus?.map(s => ({ name: APP_STATUS_UA[s.status] || s.status, value: parseInt(s.count) })) || [];
  const appsChartData = data?.appsByMonth?.map(m => ({ month: m.month, 'Заявки': parseInt(m.count) })) || [];
  const usersChartData = data?.newUsers?.map(m => ({ month: m.month, 'Нові користувачі': parseInt(m.count) })) || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> Статистика платформи</h1>
        <p className="page-subtitle">Аналітика та показники роботи платформи</p>
      </div>

      {/* Overview */}
      {general && (
        <div className="card-grid card-grid-4" style={{ marginBottom: 28 }}>
          {[
            { label: 'Всього тварин', value: general.total_animals, emoji: '', color: '#FF6B35' },
            { label: 'Доступні', value: general.available_animals, emoji: '', color: '#2D6A4F' },
            { label: 'Прилаштовані', value: general.adopted_animals, emoji: '', color: '#6366F1' },
            { label: 'Притулків', value: general.total_shelters, emoji: '', color: '#FFB347' },
            { label: 'Користувачів', value: general.total_users, emoji: '', color: '#EC4899' },
            { label: 'Заявок всього', value: general.total_applications, emoji: '', color: '#14B8A6' },
          ].map(s => (
            <div key={s.label} className="card stat-card">
              <div className="stat-icon" style={{ background: `${s.color}15`, fontSize: '1.5rem' }}>{s.emoji}</div>
              <div>
                <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Species pie */}
        <div className="card">
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 20 }}>Тварини за видами</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={speciesData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {speciesData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status bar */}
        <div className="card">
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 20 }}>Статуси тварин</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" name="Кількість" radius={[6, 6, 0, 0]}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Applications by month */}
        <div className="card">
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 20 }}>Заявки за місяцями</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={appsChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Заявки" stroke="#FF6B35" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* New users */}
        <div className="card">
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 20 }}>Нові користувачі</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={usersChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Нові користувачі" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* App statuses */}
        <div className="card">
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 20 }}>Статуси заявок</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={appStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {appStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top shelters */}
        <div className="card">
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 20 }}>Топ притулки за тваринами</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(data?.topShelters || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: COLORS[i % COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</div>
                  <div style={{ height: 6, background: '#F3F4F6', borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: COLORS[i % COLORS.length], borderRadius: 3, width: `${(s.animal_count / (data.topShelters[0]?.animal_count || 1)) * 100}%` }} />
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: COLORS[i % COLORS.length] }}>{s.animal_count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
