import React, { useEffect, useState } from 'react';
import { applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_LABELS = { pending: 'Очікує', reviewing: 'Розглядається', approved: 'Схвалено', rejected: 'Відхилено', cancelled: 'Скасовано' };
const TYPE_LABELS = { adopt: 'Усиновлення', foster: 'Тимчасова опіка', volunteer: 'Волонтерство', donate_supplies: 'Допомога речами' };

export default function ApplicationsPage() {
  const { user, isShelterOwner, isAdmin } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [statusNote, setStatusNote] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const r = await applicationsAPI.getAll(filter ? { status: filter } : {});
      setApps(r.data.applications);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    try {
      await applicationsAPI.updateStatus(id, { status, admin_notes: statusNote });
      toast.success('Статус оновлено');
      setSelected(null);
      load();
    } catch { toast.error('Помилка оновлення'); }
  };

  const cancel = async (id) => {
    if (!window.confirm('Скасувати заявку?')) return;
    try {
      await applicationsAPI.cancel(id);
      toast.success('Заявку скасовано');
      load();
    } catch { toast.error('Помилка'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> Заявки</h1>
        <p className="page-subtitle">
          {isShelterOwner || isAdmin ? 'Управління заявками на опіку тварин' : 'Ваші заявки на опіку'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'pending', 'reviewing', 'approved', 'rejected', 'cancelled'].map(s => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(s)}>
            {s ? STATUS_LABELS[s] : 'Всі'}
          </button>
        ))}
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> :
        apps.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>Заявок не знайдено</h3>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Тварина</th>
                  {(isShelterOwner || isAdmin) && <th>Заявник</th>}
                  <th>Тип</th>
                  <th>Притулок</th>
                  <th>Статус</th>
                  <th>Дата</th>
                  <th>Дії</th>
                </tr>
              </thead>
              <tbody>
                {apps.map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 600 }}>#{app.id}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', background: '#FFE4D6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                          {app.animal_photo ? <img src={app.animal_photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : ''}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.animal_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.species}</div>
                        </div>
                      </div>
                    </td>
                    {(isShelterOwner || isAdmin) && (
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.user_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{app.user_email}</div>
                      </td>
                    )}
                    <td><span className="badge" style={{ background: '#E0E7FF', color: '#3730A3' }}>{TYPE_LABELS[app.type]}</span></td>
                    <td style={{ fontSize: '0.88rem' }}>{app.shelter_name}</td>
                    <td><span className={`badge badge-${app.status}`}>{STATUS_LABELS[app.status]}</span></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(app.created_at).toLocaleDateString('uk-UA')}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(isShelterOwner || isAdmin) && app.status === 'pending' && (
                          <>
                            <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(app.id, 'reviewing')}>Розглянути</button>
                            <button className="btn btn-sm btn-primary" onClick={() => updateStatus(app.id, 'approved')}>✓ Схвалити</button>
                            <button className="btn btn-sm btn-danger" onClick={() => { setSelected(app); }}>✕ Відхилити</button>
                          </>
                        )}
                        {(isShelterOwner || isAdmin) && app.status === 'reviewing' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => updateStatus(app.id, 'approved')}>✓ Схвалити</button>
                            <button className="btn btn-sm btn-danger" onClick={() => setSelected(app)}>✕ Відхилити</button>
                          </>
                        )}
                        {!isShelterOwner && !isAdmin && ['pending', 'reviewing'].includes(app.status) && (
                          <button className="btn btn-sm btn-danger" onClick={() => cancel(app.id)}>Скасувати</button>
                        )}
                        <button className="btn btn-sm btn-ghost" onClick={() => setSelected({ ...app, viewOnly: true })}>Деталі</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {/* Details/Reject Modal */}
      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <h2 className="modal-title">{selected.viewOnly ? 'Деталі заявки' : 'Відхилити заявку'} #{selected.id}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div><strong>Тварина:</strong> {selected.animal_name}</div>
              <div><strong>Заявник:</strong> {selected.user_name} ({selected.user_email})</div>
              {selected.user_phone && <div><strong>Телефон:</strong> {selected.user_phone}</div>}
              <div><strong>Тип:</strong> {TYPE_LABELS[selected.type]}</div>
              {selected.living_situation && <div><strong>Умови:</strong> {selected.living_situation}</div>}
              {selected.message && <div><strong>Повідомлення:</strong> {selected.message}</div>}
              {selected.experience && <div><strong>Досвід:</strong> {selected.experience}</div>}
              <div><strong>Є тварини:</strong> {selected.has_other_pets ? 'Так' : 'Ні'} | <strong>Є діти:</strong> {selected.has_children ? 'Так' : 'Ні'}</div>
              {selected.admin_notes && <div style={{ background: '#FEF3C7', padding: '10px', borderRadius: 8 }}><strong>Нотатки:</strong> {selected.admin_notes}</div>}
            </div>
            {!selected.viewOnly && (
              <div className="form-group">
                <label className="form-label">Причина відмови (необов'язково)</label>
                <textarea className="form-control" rows={3} value={statusNote} onChange={e => setStatusNote(e.target.value)} placeholder="Поясніть причину відхилення..." />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Закрити</button>
              {!selected.viewOnly && (
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => updateStatus(selected.id, 'rejected')}>
                  Відхилити заявку
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
