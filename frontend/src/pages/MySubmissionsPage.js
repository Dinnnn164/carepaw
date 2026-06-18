import React, { useEffect, useState } from 'react';
import { animalsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Clock, CheckCircle, XCircle, Upload } from 'lucide-react';

const SPECIES_LABELS = { dog: 'Собака', cat: 'Кіт', bird: 'Птах', rabbit: 'Кролик', other: 'Інше' };
const SPECIES_EMOJI = { dog: '', cat: '', bird: '', rabbit: '', other: '' };

const emptyForm = {
  name: '', species: 'dog', breed: '', age_years: 0, age_months: 0,
  gender: 'unknown', size: 'medium', color: '', description: '',
  health_status: '', vaccinated: false, sterilized: false,
  microchipped: false, photo: '', weight: ''
};

export default function MySubmissionsPage() {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);  

  const load = async () => {
    setLoading(true);
    try {
      const r = await animalsAPI.getAll({ my_submissions: true, user_id: user.id, limit: 50, status: '' });
      setAnimals(r.data.animals);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);
const handlePhotoUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  setUploadingPhoto(true);
  try {
    const res = await animalsAPI.uploadPhoto(file);
    setForm(prev => ({ ...prev, photo: res.data.url }));
    toast.success('Фото завантажено!');
  } catch (err) {
    toast.error('Помилка завантаження фото');
  } finally {
    setUploadingPhoto(false);
  }
};

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.species) return toast.error('Заповніть обов\'язкові поля');
    setSaving(true);
    try {
      const r = await animalsAPI.create(form);
      toast.success(r.data.message);
      setShowModal(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка');
    } finally { setSaving(false); }
  };

  const deleteAnimal = async (id) => {
    if (!window.confirm('Видалити оголошення?')) return;
    try {
      await animalsAPI.delete(id);
      toast.success('Оголошення видалено');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Можна видалити лише очікуючі оголошення');
    }
  };

  const statusInfo = {
    pending: { label: 'На розгляді', icon: <Clock size={14} />, bg: '#FEF3C7', color: '#92400E' },
    approved: { label: 'Схвалено', icon: <CheckCircle size={14} />, bg: '#D1FAE5', color: '#065F46' },
    rejected: { label: 'Відхилено', icon: <XCircle size={14} />, bg: '#FEE2E2', color: '#991B1B' },
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title"> Мої оголошення</h1>
          <p className="page-subtitle">Подайте оголошення про тварину — після схвалення адміністратором воно з'явиться на сайті</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Додати тварину
        </button>
      </div>

      <div className="alert alert-info" style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: '1.2rem' }}></span>
        <div>
          <strong>Як це працює:</strong> Ви подаєте оголошення про тварину, яка потребує допомоги.
          Адміністратор перевіряє інформацію і публікує її. Якщо є питання — оголошення може бути відхилено з поясненням.
        </div>
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> :
        animals.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>Ви ще не подавали оголошень</h3>
            <p>Знайшли безпритульну тварину? Додайте оголошення щоб допомогти їй знайти дім</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
              <Plus size={16} /> Додати перше оголошення
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {animals.map(a => {
              const st = statusInfo[a.approval_status] || statusInfo.pending;
              return (
                <div key={a.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 20px' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                    background: 'linear-gradient(135deg, #FFE4D6, #FFDAB9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem'
                  }}>
                    {a.photo ? <img src={a.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : SPECIES_EMOJI[a.species]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontFamily: 'Unbounded', fontWeight: 700, fontSize: '1rem' }}>{a.name}</span>
                        <span style={{ marginLeft: 10, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {SPECIES_LABELS[a.species]}{a.breed ? ` · ${a.breed}` : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: st.bg, color: st.color, fontSize: '0.8rem', fontWeight: 700 }}>
                        {st.icon} {st.label}
                      </div>
                    </div>
                    {a.description && (
                      <p style={{ fontSize: '0.87rem', color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
                        {a.description.slice(0, 120)}{a.description.length > 120 ? '...' : ''}
                      </p>
                    )}
                    {a.approval_status === 'rejected' && a.rejection_reason && (
                      <div style={{ background: '#FEE2E2', borderRadius: 8, padding: '8px 12px', fontSize: '0.85rem', color: '#991B1B', marginBottom: 6 }}>
                        <strong>Причина відхилення:</strong> {a.rejection_reason}
                      </div>
                    )}
                    {a.approval_status === 'pending' && (
                      <div style={{ fontSize: '0.82rem', color: '#92400E', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} /> Очікує перевірки адміністратором
                      </div>
                    )}
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      Подано: {new Date(a.created_at).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  {a.approval_status === 'pending' && (
                    <button className="btn btn-sm btn-ghost" style={{ color: '#EF4444', flexShrink: 0 }} onClick={() => deleteAnimal(a.id)}>
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )
      }

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <h2 className="modal-title"> Додати оголошення про тварину</h2>
            <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '0.85rem' }}>
              Після подачі оголошення адміністратор перевірить інформацію та опублікує її на сайті.
            </div>
            <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Ім'я тварини *</label>
                <input className="form-control" required placeholder="Наприклад: Барсик" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Вид *</label>
                <select className="form-control" value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}>
                  {Object.entries(SPECIES_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Порода</label>
                <input className="form-control" placeholder="Якщо відомо" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Стать</label>
                <select className="form-control" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                  <option value="unknown">Невідомо</option>
                  <option value="male">Самець</option>
                  <option value="female">Самка</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Вік (роки)</label>
                <input className="form-control" type="number" min="0" max="30" value={form.age_years} onChange={e => setForm({ ...form, age_years: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Вік (місяці)</label>
                <input className="form-control" type="number" min="0" max="11" value={form.age_months} onChange={e => setForm({ ...form, age_months: e.target.value })} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Розмір</label>
                <select className="form-control" value={form.size} onChange={e => setForm({ ...form, size: e.target.value })}>
                  <option value="small">Малий</option>
                  <option value="medium">Середній</option>
                  <option value="large">Великий</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Колір</label>
                <input className="form-control" placeholder="Наприклад: руде з білим" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
  <label className="form-label">Фото тварини</label>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    {form.photo && (
      <img src={form.photo} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover' }} />
    )}
    <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
      <Upload size={16} /> {uploadingPhoto ? 'Завантаження...' : 'Обрати файл'}
      <input type="file" accept="image/*" style={{ display: 'none' }}
        onChange={handlePhotoUpload} disabled={uploadingPhoto} />
    </label>
  </div>
</div>
              <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
                <label className="form-label">Опис *</label>
                <textarea className="form-control" rows={3} required placeholder="Розкажіть про тварину: де знайшли, характер, особливості..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2', margin: 0 }}>
                <label className="form-label">Стан здоров'я</label>
                <textarea className="form-control" rows={2} placeholder="Чи є травми, хвороби, потреба у ветеринарній допомозі..." value={form.health_status} onChange={e => setForm({ ...form, health_status: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 20 }}>
                {[['vaccinated', ' Вакцинована'], ['sterilized', ' Стерилізована'], ['microchipped', ' Є чіп']].map(([k, l]) => (
                  <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={!!form[k]} onChange={e => setForm({ ...form, [k]: e.target.checked })} />
                    {l}
                  </label>
                ))}
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Скасувати</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={saving}>
                  {saving ? 'Надсилання...' : ' Подати на розгляд'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}