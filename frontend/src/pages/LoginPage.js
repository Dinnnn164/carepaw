import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Ласкаво просимо!');
    } catch (err) {
      setError(err.response?.data?.message || 'Помилка входу');
    } finally { setLoading(false); }
  };

  const demoLogin = async (email) => {
    setForm({ email, password: 'password' });
    setLoading(true);
    try {
      await login(email, 'password');
      toast.success('Вхід виконано!');
    } catch { setError('Помилка демо входу'); } 
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon"></div>
          <h1>CarePaw</h1>
          <p>Платформа допомоги безпритульним тваринам</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handle}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input className="form-control" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
            {loading ? 'Вхід...' : 'Увійти'}
          </button>
        </form>

     

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.9rem', color: '#6B7280' }}>
          Немає акаунту? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
}
