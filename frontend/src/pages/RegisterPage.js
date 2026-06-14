import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Пароль мінімум 6 символів');
    setLoading(true);
    try {
      await register(form);
      toast.success('Реєстрація успішна!');
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка реєстрації');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"></div>
          <h1>Реєстрація</h1>
          <p>Приєднайтесь до спільноти захисту тварин</p>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Ім'я та прізвище</label>
            <input className="form-control" placeholder="Іван Петренко"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Телефон</label>
            <input className="form-control" placeholder="+380 XX XXX XX XX"
              value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input className="form-control" type="password" placeholder="Мінімум 6 символів"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Тип акаунту</label>
            <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="user">Звичайний користувач</option>
              <option value="shelter_owner">Власник притулку</option>
            </select>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Реєстрація...' : 'Зареєструватися'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: '#6B7280' }}>
          Вже є акаунт? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Увійти</Link>
        </p>
      </div>
    </div>
  );
}
