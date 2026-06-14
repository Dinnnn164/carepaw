import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { animalsAPI } from '../services/api';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

const SPECIES_EMOJI = { dog: '', cat: '', bird: '', rabbit: '', other: '' };
const SPECIES_LABELS = { dog: 'Собака', cat: 'Кіт', bird: 'Птах', rabbit: 'Кролик', other: 'Інше' };
const STATUS_LABELS = { available: 'Доступна', pending: 'Очікує', adopted: 'Прилаштована', medical_care: 'Лікування', reserved: 'Зарезервована' };

export default function AnimalsPage() {
  const [animals, setAnimals] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    search: '', species: '', status: 'available', size: '', gender: '',
    vaccinated: '', sterilized: '', sort: 'created_at', order: 'DESC'
  });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { ...filters, page, limit: 12 };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const r = await animalsAPI.getAll(params);
      setAnimals(r.data.animals);
      setTotal(r.data.total);
    } catch { } finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateFilter = (key, val) => {
    setFilters(f => ({ ...f, [key]: val }));
    setPage(1);
  };

  const totalPages = Math.ceil(total / 12);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> Тварини</h1>
        <p className="page-subtitle">Знайдіть свого майбутнього друга — {total} тварин чекають на вас</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div className="filters-bar">
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input className="search-input" style={{ paddingLeft: 36 }} placeholder="Пошук за ім'ям, породою..."
              value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
          </div>

          <select className="filter-select" value={filters.species} onChange={e => updateFilter('species', e.target.value)}>
            <option value="">Всі види</option>
            {Object.entries(SPECIES_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          <select className="filter-select" value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
            <option value="">Будь-який статус</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>

          <select className="filter-select" value={filters.size} onChange={e => updateFilter('size', e.target.value)}>
            <option value="">Будь-який розмір</option>
            <option value="small">Малий</option>
            <option value="medium">Середній</option>
            <option value="large">Великий</option>
          </select>

          <select className="filter-select" value={filters.gender} onChange={e => updateFilter('gender', e.target.value)}>
            <option value="">Стать</option>
            <option value="male">Самець</option>
            <option value="female">Самка</option>
          </select>

          <select className="filter-select" value={filters.vaccinated} onChange={e => updateFilter('vaccinated', e.target.value)}>
            <option value="">Вакцинація</option>
            <option value="true">Щеплена</option>
            <option value="false">Не щеплена</option>
          </select>

          <select className="filter-select" value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}>
            <option value="created_at">За датою</option>
            <option value="name">За іменем</option>
            <option value="age_years">За віком</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loader"><div className="spinner" /></div>
      ) : animals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"></div>
          <h3>Тварин не знайдено</h3>
          <p>Спробуйте змінити фільтри пошуку</p>
        </div>
      ) : (
        <>
          <div className="card-grid card-grid-3">
            {animals.map(animal => (
              <div key={animal.id} className="animal-card" onClick={() => navigate(`/animals/${animal.id}`)}>
                <div className="animal-card-img">
                  {animal.photo
                    ? <img src={animal.photo} alt={animal.name} onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = SPECIES_EMOJI[animal.species] || ''; }} />
                    : SPECIES_EMOJI[animal.species] || ''
                  }
                </div>
                <div className="animal-card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div className="animal-card-name">{animal.name}</div>
                    <span className={`badge badge-${animal.status}`}>{STATUS_LABELS[animal.status]}</span>
                  </div>
                  <div className="animal-card-meta">
                    <span className={`badge badge-${animal.species}`}>{SPECIES_LABELS[animal.species]}</span>
                    {animal.breed && <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>{animal.breed}</span>}
                    <span className="badge" style={{ background: '#F3F4F6', color: '#374151' }}>
                      {animal.age_years > 0 ? `${animal.age_years} р.` : `${animal.age_months} міс.`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                    {animal.vaccinated && <span style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}> Щеплена</span>}
                    {animal.sterilized && <span style={{ fontSize: '0.78rem', color: 'var(--secondary)' }}> Стерилізована</span>}
                  </div>
                  {animal.shelter_name && (
                    <div className="animal-card-shelter">
                       {animal.shelter_name}{animal.shelter_city ? `, ${animal.shelter_city}` : ''}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
