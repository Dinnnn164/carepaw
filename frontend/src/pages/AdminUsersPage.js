import React, { useEffect, useState } from 'react';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Search, UserX } from 'lucide-react';

const ROLE_LABELS = { admin: 'Адмін', shelter_owner: 'Власник притулку', user: 'Користувач' };
const ROLE_COLORS = { admin: '#FF6B35', shelter_owner: '#2D6A4F', user: '#6B7280' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const r = await usersAPI.getAll({ search, role: roleFilter, page, limit: 20 });
      setUsers(r.data.users);
      setTotal(r.data.total);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, roleFilter, page]);

  const toggle = async (id) => {
    try { await usersAPI.toggleActive(id); toast.success('Статус змінено'); load(); }
    catch { toast.error('Помилка'); }
  };

  const changeRole = async (id, role) => {
    try { await usersAPI.changeRole(id, role); toast.success('Роль змінено'); load(); }
    catch { toast.error('Помилка'); }
  };

  const del = async (id) => {
    if (!window.confirm('Видалити користувача? Цю дію не можна скасувати.')) return;
    try { await usersAPI.delete(id); toast.success('Користувача видалено'); load(); }
    catch { toast.error('Помилка'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Користувачі</h1>
        <p className="page-subtitle">Управління обліковими записами платформи — всього {total}</p>
      </div>

      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: 'var(--text-secondary)'
          }} />
          <input
            className="search-input"
            style={{ paddingLeft: 36 }}
            placeholder="Пошук за ім'ям або email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="filter-select"
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
        >
          <option value="">Всі ролі</option>
          <option value="admin">Адміністратори</option>
          <option value="shelter_owner">Власники притулків</option>
          <option value="user">Звичайні користувачі</option>
        </select>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : isMobile ? (
        // МОБІЛЬНА ВЕРСІЯ — картки
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {users.map(u => (
            <div key={u.id} style={{
              background: 'white', borderRadius: 12, padding: 16,
              border: '1px solid var(--border)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
            }}>
              {/* Шапка картки */}
              <div style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    background: ROLE_COLORS[u.role], color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: '1rem', flexShrink: 0
                  }}>
                    {u.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{u.name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </div>
                  </div>
                </div>
                <span className={`badge ${u.is_active ? 'badge-available' : 'badge-rejected'}`}>
                  {u.is_active ? 'Активний' : 'Заблок.'}
                </span>
              </div>

              {/* Додаткова інформація */}
              <div style={{
                fontSize: '0.82rem', color: 'var(--text-secondary)',
                marginBottom: 12
              }}>
                {u.phone && <span style={{ marginRight: 12 }}> {u.phone}</span>}
                <span> {new Date(u.created_at).toLocaleDateString('uk-UA')}</span>
              </div>

              {/* Дії */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  style={{
                    padding: '6px 10px', borderRadius: 8, flex: 1,
                    border: `2px solid ${ROLE_COLORS[u.role]}`,
                    color: ROLE_COLORS[u.role], fontWeight: 600,
                    fontSize: '0.82rem', background: 'white', cursor: 'pointer'
                  }}
                  value={u.role}
                  onChange={e => changeRole(u.id, e.target.value)}
                >
                  <option value="user">Користувач</option>
                  <option value="shelter_owner">Власник притулку</option>
                  <option value="admin">Адмін</option>
                </select>
                <button
                  className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={() => toggle(u.id)}
                >
                  {u.is_active ? 'Блок' : 'Розблок'}
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ color: '#EF4444' }}
                  onClick={() => del(u.id)}
                >
                  <UserX size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // ДЕСКТОПНА ВЕРСІЯ — таблиця
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Користувач</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Роль</th>
                <th>Статус</th>
                <th>Дата реєстрації</th>
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{u.id}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: ROLE_COLORS[u.role], color: 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, flexShrink: 0
                      }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{u.email}</td>
                  <td style={{ fontSize: '0.88rem' }}>{u.phone || '—'}</td>
                  <td>
                    <select
                      style={{
                        padding: '4px 8px', borderRadius: 6,
                        border: `2px solid ${ROLE_COLORS[u.role]}`,
                        color: ROLE_COLORS[u.role], fontWeight: 600,
                        fontSize: '0.82rem', background: 'white', cursor: 'pointer'
                      }}
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                    >
                      <option value="user">Користувач</option>
                      <option value="shelter_owner">Власник притулку</option>
                      <option value="admin">Адмін</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.is_active ? 'badge-available' : 'badge-rejected'}`}>
                      {u.is_active ? 'Активний' : 'Заблокований'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(u.created_at).toLocaleDateString('uk-UA')}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => toggle(u.id)}
                      >
                        {u.is_active ? 'Блок' : 'Розблок'}
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        style={{ color: '#EF4444' }}
                        onClick={() => del(u.id)}
                      >
                        <UserX size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}