import React, { useEffect, useState } from 'react';
import { sheltersAPI, animalsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Building2 } from 'lucide-react';

const SPECIES_LABELS = { dog: 'Собака', cat: 'Кіт', bird: 'Птах', rabbit: 'Кролик', other: 'Інше' };
const STATUS_LABELS = { available: 'Доступна', pending: 'Очікує', adopted: 'Прилаштована', medical_care: 'Лікування', reserved: 'Зарезервована' };

const emptyAnimal = { name: '', species: 'dog', breed: '', age_years: 0, age_months: 0, gender: 'unknown', size: 'medium', color: '', description: '', health_status: '', vaccinated: false, sterilized: false, microchipped: false, photo: '', weight: '', status: 'available' };

export default function ShelterManagePage() {
  const { user } = useAuth();
  const [shelter, setShelter] = useState(null);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('animals');
  const [showAnimalModal, setShowAnimalModal] = useState(false);
  const [editAnimal, setEditAnimal] = useState(null);
  const [animalForm, setAnimalForm] = useState(emptyAnimal);
  const [shelterForm, setShelterForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const sr = await sheltersAPI.getMy();
      setShelter(sr.data);
      if (sr.data) {
        setShelterForm(sr.data);
        const ar = await animalsAPI.getAll({ shelter_id: sr.data.id, limit: 100, status: '' });
        setAnimals(ar.data.animals);
      }
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const saveShelter = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (shelter) {
        await sheltersAPI.update(shelter.id, shelterForm);
        toast.success('Притулок оновлено');
      } else {
        await sheltersAPI.create(shelterForm);
        toast.success('Притулок створено');
      }
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка');
    } finally { setSaving(false); }
  };

  const openAddAnimal = () => {
    setEditAnimal(null);
    setAnimalForm({ ...emptyAnimal, shelter_id: shelter?.id });
    setShowAnimalModal(true);
  };

  const openEditAnimal = (a) => {
    setEditAnimal(a);
    setAnimalForm({ ...a });
    setShowAnimalModal(true);
  };

  const saveAnimal = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editAnimal) {
        await animalsAPI.update(editAnimal.id, animalForm);
        toast.success('Тварину оновлено');
      } else {
        await animalsAPI.create({ ...animalForm, shelter_id: shelter.id });
        toast.success('Тварину додано');
      }
      setShowAnimalModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка');
    } finally { setSaving(false); }
  };

  const deleteAnimal = async (id) => {
    if (!window.confirm('Видалити тварину?')) return;
    try { await animalsAPI.delete(id); toast.success('Тварину видалено'); loadData(); }
    catch { toast.error('Помилка'); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> Керування притулком</h1>
        <p className="page-subtitle">{shelter?.name || 'Налаштуйте інформацію про ваш притулок'}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['animals', 'shelter'].map(t => (
          <button key={t} className={`btn ${tab === t ? 'btn-primary' : 'btn-outline'}`} onClick={() => setTab(t)}>
            {t === 'animals' ? ' Тварини' : ' Інформація про притулок'}
          </button>
        ))}
      </div>

      {tab === 'shelter' && (
        <div className="card">
          <h2 style={{ fontFamily: 'Unbounded', fontSize: '1.1rem', marginBottom: 20 }}>
            {shelter ? 'Редагування притулку' : 'Створити притулок'}
          </h2>
          <form onSubmit={saveShelter} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { key: 'name', label: 'Назва притулку', required: true },
              { key: 'city', label: 'Місто' },
              { key: 'address', label: 'Адреса' },
              { key: 'phone', label: 'Телефон' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'website', label: 'Вебсайт' },
              { key: 'capacity', label: 'Місткість', type: 'number' },
            ].map(f => (
              <div key={f.key} className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{f.label} {f.required && '*'}</label>
                <input className="form-control" type={f.type || 'text'} required={f.required}
                  value={shelterForm[f.key] || ''} onChange={e => setShelterForm({ ...shelterForm, [f.key]: e.target.value })} />
              </div>
            ))}
            <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
              <label className="form-label">Опис</label>
              <textarea className="form-control" rows={3} value={shelterForm.description || ''}
                onChange={e => setShelterForm({ ...shelterForm, description: e.target.value })} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Зберігаємо...' : shelter ? 'Зберегти зміни' : 'Створити притулок'}
              </button>
            </div>
          </form>
        </div>
      )}

      {tab === 'animals' && (
        <div>
          {!shelter ? (
            <div className="alert alert-info">Спочатку створіть притулок у вкладці "Інформація про притулок"</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ color: 'var(--text-secondary)' }}>Всього тварин: {animals.length}</div>
                <button className="btn btn-primary" onClick={openAddAnimal}><Plus size={16} /> Додати тварину</button>
              </div>

              {animals.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"></div>
                  <h3>У вашому притулку ще немає тварин</h3>
                  <p>Додайте першу тварину щоб розпочати</p>
                  <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAddAnimal}><Plus size={16} /> Додати тварину</button>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Тварина</th><th>Вид/Порода</th><th>Вік</th><th>Стать</th><th>Здоров'я</th><th>Статус</th><th>Дії</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animals.map(a => (
                        <tr key={a.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 42, height: 42, borderRadius: 8, overflow: 'hidden', background: '#FFE4D6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                                {a.photo ? <img src={a.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (a.species === 'dog' ? '' : a.species === 'cat' ? '' : '')}
                              </div>
                              <span style={{ fontWeight: 600 }}>{a.name}</span>
                            </div>
                          </td>
                          <td>{SPECIES_LABELS[a.species]}{a.breed ? ` / ${a.breed}` : ''}</td>
                          <td>{a.age_years > 0 ? `${a.age_years} р.` : `${a.age_months} міс.`}</td>
                          <td>{a.gender === 'male' ? '♂' : a.gender === 'female' ? '♀' : '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4 }}>
                              {a.vaccinated && <span style={{ fontSize: '1rem' }} title="Вакцинована"></span>}
                              {a.sterilized && <span style={{ fontSize: '1rem' }} title="Стерилізована"></span>}
                              {a.microchipped && <span style={{ fontSize: '1rem' }} title="Є чіп"></span>}
                              {!a.vaccinated && !a.sterilized && <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>—</span>}
                            </div>
                          </td>
                          <td>
                            <select className="filter-select" style={{ fontSize: '0.82rem', padding: '4px 8px' }}
                              value={a.status} onChange={async (e) => {
                                try { await animalsAPI.update(a.id, { ...a, status: e.target.value }); toast.success('Статус оновлено'); loadData(); }
                                catch { toast.error('Помилка'); }
                              }}>
                              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn btn-sm btn-ghost" onClick={() => openEditAnimal(a)}><Edit size={14} /></button>
                              <button className="btn btn-sm btn-ghost" style={{ color: '#EF4444' }} onClick={() => deleteAnimal(a.id)}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Animal Modal */}
      {showAnimalModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowAnimalModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <h2 className="modal-title">{editAnimal ? 'Редагувати тварину' : 'Додати тварину'}</h2>
            <form onSubmit={saveAnimal} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { key: 'name', label: "Ім'я", required: true },
                { key: 'breed', label: 'Порода' },
                { key: 'color', label: 'Колір' },
                { key: 'weight', label: 'Вага (кг)', type: 'number' },
                { key: 'age_years', label: 'Вік (роки)', type: 'number' },
                { key: 'age_months', label: 'Вік (місяці)', type: 'number' },
                { key: 'photo', label: 'URL фото', span: 2 },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ gridColumn: f.span ? `span ${f.span}` : undefined, margin: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-control" type={f.type || 'text'} required={f.required}
                    value={animalForm[f.key] || ''} onChange={e => setAnimalForm({ ...animalForm, [f.key]: e.target.value })} />
                </div>
              ))}
              {[
                { key: 'species', label: 'Вид', opts: Object.entries(SPECIES_LABELS) },
                { key: 'gender', label: 'Стать', opts: [['male', 'Самець'], ['female', 'Самка'], ['unknown', 'Невідомо']] },
                { key: 'size', label: 'Розмір', opts: [['small', 'Малий'], ['medium', 'Середній'], ['large', 'Великий']] },
                { key: 'status', label: 'Статус', opts: Object.entries(STATUS_LABELS) },
              ].map(f => (
                <div key={f.key} className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{f.label}</label>
                  <select className="form-control" value={animalForm[f.key] || ''} onChange={e => setAnimalForm({ ...animalForm, [f.key]: e.target.value })}>
                    {f.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 20 }}>
                {[['vaccinated', 'Вакцинована'], ['sterilized', 'Стерилізована'], ['microchipped', 'Є чіп']].map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={!!animalForm[k]} onChange={e => setAnimalForm({ ...animalForm, [k]: e.target.checked })} />
                    {l}
                  </label>
                ))}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
                <label className="form-label">Опис</label>
                <textarea className="form-control" rows={2} value={animalForm.description || ''}
                  onChange={e => setAnimalForm({ ...animalForm, description: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
                <label className="form-label">Стан здоров'я</label>
                <textarea className="form-control" rows={2} value={animalForm.health_status || ''}
                  onChange={e => setAnimalForm({ ...animalForm, health_status: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAnimalModal(false)}>Скасувати</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Збереження...' : editAnimal ? 'Зберегти зміни' : 'Додати тварину'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
