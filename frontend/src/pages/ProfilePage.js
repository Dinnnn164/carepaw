// ProfilePage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export function ProfilePage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authAPI.updateProfile(form);
      toast.success('Профіль оновлено');
    } catch { toast.error('Помилка збереження'); }
    finally { setSaving(false); }
  };

  const ROLE_LABELS = { admin: 'Адміністратор', shelter_owner: 'Власник притулку', user: 'Звичайний користувач' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> Профіль</h1>
        <p className="page-subtitle">Керуйте своїми даними</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700, margin: '0 auto 16px' }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <h2 style={{ fontFamily: 'Unbounded', fontSize: '1.1rem' }}>{user?.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '4px 0 12px' }}>{user?.email}</p>
          <span className="badge" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--primary)' }}>
            {ROLE_LABELS[user?.role]}
          </span>
          <div style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            Учасник з {new Date(user?.created_at || Date.now()).toLocaleDateString('uk-UA')}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', marginBottom: 20 }}>Редагувати профіль</h3>
          <form onSubmit={save}>
            <div className="form-group">
              <label className="form-label">Ім'я та прізвище</label>
              <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Email (не можна змінити)</label>
              <input className="form-control" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Телефон</label>
              <input className="form-control" placeholder="+380 XX XXX XX XX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Зберігаємо...' : 'Зберегти зміни'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
