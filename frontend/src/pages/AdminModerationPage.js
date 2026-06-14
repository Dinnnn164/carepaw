import React, { useEffect, useState } from 'react';
import { animalsAPI } from '../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye } from 'lucide-react';

const SPECIES_LABELS = { dog: 'Собака', cat: 'Кіт', bird: 'Птах', rabbit: 'Кролик', other: 'Інше' };
const SPECIES_EMOJI = { dog: '', cat: '', bird: '', rabbit: '', other: '' };

export default function AdminModerationPage() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await animalsAPI.getAll({ approval_status: filter, limit: 100, status: '' });
      setAnimals(r.data.animals);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id, approval_status, rejection_reason = '') => {
    setProcessing(true);
    try {
      await animalsAPI.review(id, { approval_status, rejection_reason });
      toast.success(approval_status === 'approved' ? ' Оголошення схвалено і опубліковано!' : ' Оголошення відхилено');
      setSelected(null);
      setRejectReason('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка');
    } finally { setProcessing(false); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> Модерація оголошень</h1>
        <p className="page-subtitle">Перевіряйте та публікуйте оголошення від користувачів</p>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
        {[
          { key: 'pending', label: ' На розгляді', color: '#92400E' },
          { key: 'approved', label: ' Схвалені', color: '#065F46' },
          { key: 'rejected', label: ' Відхилені', color: '#991B1B' },
        ].map(f => (
          <button key={f.key}
            className={`btn ${filter === f.key ? 'btn-primary' : 'btn-outline'}`}
            style={filter === f.key ? {} : { borderColor: f.color, color: f.color }}
            onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> :
        animals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">{filter === 'pending' ? '' : ''}</div>
            <h3>{filter === 'pending' ? 'Немає оголошень на розгляді' : 'Оголошень не знайдено'}</h3>
            {filter === 'pending' && <p>Усі оголошення опрацьовано!</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {animals.map(a => (
              <div key={a.id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FFE4D6, #FFDAB9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem'
                  }}>
                    {a.photo
                      ? <img src={a.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                      : SPECIES_EMOJI[a.species]
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontFamily: 'Unbounded', fontWeight: 700, fontSize: '1.05rem' }}>{a.name}</span>
                        <span style={{ marginLeft: 10, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                          {SPECIES_LABELS[a.species]}{a.breed ? ` · ${a.breed}` : ''}
                          {a.age_years > 0 ? ` · ${a.age_years} р.` : a.age_months > 0 ? ` · ${a.age_months} міс.` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        #{a.id} · {new Date(a.created_at).toLocaleDateString('uk-UA')}
                      </div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--primary)' }}>
                         Подав: {a.submitted_by_name || 'Користувач'}
                      </span>
                    </div>
                    {a.description && (
                      <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>
                        {a.description.slice(0, 200)}{a.description.length > 200 ? '...' : ''}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                      {a.vaccinated && <span style={{ fontSize: '0.78rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 6 }}> Вакцинована</span>}
                      {a.sterilized && <span style={{ fontSize: '0.78rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 6 }}> Стерилізована</span>}
                      {a.microchipped && <span style={{ fontSize: '0.78rem', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: 6 }}> Є чіп</span>}
                    </div>
                    {a.rejection_reason && (
                      <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '8px 12px', fontSize: '0.83rem', color: '#991B1B', marginBottom: 8 }}>
                        <strong>Причина відхилення:</strong> {a.rejection_reason}
                      </div>
                    )}
                    {filter === 'pending' && (
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn btn-secondary btn-sm" disabled={processing} onClick={() => review(a.id, 'approved')}>
                          <CheckCircle size={14} /> Схвалити та опублікувати
                        </button>
                        <button className="btn btn-sm" style={{ background: '#FEE2E2', color: '#991B1B' }} disabled={processing} onClick={() => setSelected(a)}>
                          <XCircle size={14} /> Відхилити
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSelected({ ...a, viewOnly: true })}>
                          <Eye size={14} /> Деталі
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {selected && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelected(null)}>
          <div className="modal">
            <h2 className="modal-title">
              {selected.viewOnly ? `Деталі: ${selected.name}` : `Відхилити: ${selected.name}`}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <div><strong>Вид:</strong> {SPECIES_LABELS[selected.species]}</div>
              {selected.breed && <div><strong>Порода:</strong> {selected.breed}</div>}
              <div><strong>Подав:</strong> {selected.submitted_by_name}</div>
              {selected.description && <div><strong>Опис:</strong> {selected.description}</div>}
              {selected.health_status && <div><strong>Здоров'я:</strong> {selected.health_status}</div>}
              {selected.photo && (
                <div>
                  <strong>Фото:</strong><br />
                  <img src={selected.photo} alt="" style={{ maxWidth: '100%', borderRadius: 8, marginTop: 6 }} onError={e => e.target.style.display = 'none'} />
                </div>
              )}
            </div>
            {!selected.viewOnly && (
              <div className="form-group">
                <label className="form-label">Причина відхилення (буде показана користувачу)</label>
                <textarea className="form-control" rows={3}
                  placeholder="Наприклад: недостатньо інформації, неякісне фото..."
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" onClick={() => { setSelected(null); setRejectReason(''); }}>Закрити</button>
              {!selected.viewOnly && (
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}
                  disabled={processing} onClick={() => review(selected.id, 'rejected', rejectReason)}>
                  <XCircle size={16} /> Відхилити оголошення
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}