import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { animalsAPI, applicationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Phone, Heart } from 'lucide-react';

const SPECIES_EMOJI = { dog: '', cat: '', bird: '', rabbit: '', other: '' };
const SPECIES_LABELS = { dog: 'Собака', cat: 'Кіт', bird: 'Птах', rabbit: 'Кролик', other: 'Інше' };
const STATUS_LABELS = { available: 'Доступна', pending: 'Очікує', adopted: 'Прилаштована', medical_care: 'На лікуванні', reserved: 'Зарезервована' };

export default function AnimalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isUser } = useAuth();
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [appForm, setAppForm] = useState({
    type: 'adopt', message: '', living_situation: '', has_other_pets: false,
    has_children: false, experience: '', contact_preferred: 'any'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    animalsAPI.getOne(id)
      .then(r => setAnimal(r.data))
      .catch(() => navigate('/animals'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const submitApp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await applicationsAPI.create({ animal_id: animal.id, ...appForm });
      toast.success('Заявку подано успішно!');
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка подачі заявки');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="loader"><div className="spinner" /></div>;
  if (!animal) return null;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Назад
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* Photo */}
        <div>
          <div style={{
            width: '100%', height: 380, borderRadius: 20, overflow: 'hidden',
            background: 'linear-gradient(135deg, #FFE4D6, #FFDAB9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '6rem'
          }}>
            {animal.photo
              ? <img src={animal.photo} alt={animal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : SPECIES_EMOJI[animal.species]
            }
          </div>
        </div>

        {/* Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontFamily: 'Unbounded', fontSize: '2rem', fontWeight: 700 }}>{animal.name}</h1>
            <span className={`badge badge-${animal.status}`} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
              {STATUS_LABELS[animal.status]}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
            <span className={`badge badge-${animal.species}`}>{SPECIES_LABELS[animal.species]}</span>
            {animal.breed && <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{animal.breed}</span>}
            <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>
              {animal.gender === 'male' ? '♂ Самець' : animal.gender === 'female' ? '♀ Самка' : 'Стать невідома'}
            </span>
            <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>
              {animal.age_years > 0 ? `${animal.age_years} р. ${animal.age_months} міс.` : `${animal.age_months} міс.`}
            </span>
            {animal.weight && <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{animal.weight} кг</span>}
          </div>

          {/* Health tags */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', background: animal.vaccinated ? '#D1FAE5' : '#FEE2E2', color: animal.vaccinated ? '#065F46' : '#991B1B' }}>
              {animal.vaccinated ? ' Вакцинована' : ' Не вакцинована'}
            </span>
            <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', background: animal.sterilized ? '#D1FAE5' : '#FEE2E2', color: animal.sterilized ? '#065F46' : '#991B1B' }}>
              {animal.sterilized ? ' Стерилізована' : ' Не стерилізована'}
            </span>
            <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: '0.85rem', background: animal.microchipped ? '#D1FAE5' : '#F3F4F6', color: animal.microchipped ? '#065F46' : '#6B7280' }}>
              {animal.microchipped ? ' Є чіп' : '⬜ Без чіпа'}
            </span>
          </div>

          {animal.description && (
            <div className="card" style={{ marginBottom: 16, padding: '16px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Про тварину</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{animal.description}</p>
            </div>
          )}

          {animal.health_status && (
            <div className="card" style={{ marginBottom: 16, padding: '16px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Стан здоров'я</h3>
              <p style={{ lineHeight: 1.6, color: 'var(--text-secondary)' }}>{animal.health_status}</p>
            </div>
          )}

          {/* Shelter info */}
          {animal.shelter_name && (
            <div className="card" style={{ marginBottom: 20, padding: '16px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 10 }}>Притулок</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontWeight: 600 }}>{animal.shelter_name}</div>
                {animal.city && <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} />{animal.address}, {animal.city}</div>}
                {animal.shelter_phone && <div style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={14} />{animal.shelter_phone}</div>}
              </div>
            </div>
          )}

          {isUser && animal.status === 'available' && (
            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowModal(true)}>
              <Heart size={18} /> Подати заявку на опіку
            </button>
          )}

          {!user && (
            <div className="alert alert-info">Увійдіть щоб подати заявку на опіку цієї тварини</div>
          )}
        </div>
      </div>

      {/* Application Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Заявка на опіку: {animal.name}</h2>
            <form onSubmit={submitApp}>
              <div className="form-group">
                <label className="form-label">Тип заявки</label>
                <select className="form-control" value={appForm.type} onChange={e => setAppForm({ ...appForm, type: e.target.value })}>
                  <option value="adopt">Усиновлення</option>
                  <option value="foster">Тимчасова опіка</option>
                  <option value="volunteer">Волонтерство</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Умови проживання</label>
                <input className="form-control" placeholder="Квартира / будинок / є двір..."
                  value={appForm.living_situation} onChange={e => setAppForm({ ...appForm, living_situation: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={appForm.has_other_pets} onChange={e => setAppForm({ ...appForm, has_other_pets: e.target.checked })} />
                  Є інші тварини
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" checked={appForm.has_children} onChange={e => setAppForm({ ...appForm, has_children: e.target.checked })} />
                  Є діти
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Досвід утримання тварин</label>
                <textarea className="form-control" rows={2} placeholder="Розкажіть про свій досвід..."
                  value={appForm.experience} onChange={e => setAppForm({ ...appForm, experience: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Повідомлення для притулку</label>
                <textarea className="form-control" placeholder="Чому ви хочете взяти цю тварину?"
                  value={appForm.message} onChange={e => setAppForm({ ...appForm, message: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Зручний спосіб зв'язку</label>
                <select className="form-control" value={appForm.contact_preferred} onChange={e => setAppForm({ ...appForm, contact_preferred: e.target.value })}>
                  <option value="any">Будь-який</option>
                  <option value="phone">Телефон</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Скасувати</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Надсилання...' : 'Надіслати заявку'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
