import React, { useEffect, useState } from 'react';
import { sheltersAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Footprints, MapPin, Phone, Mail, ExternalLink } from 'lucide-react';
export default function SheltersPage() {
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    sheltersAPI.getAll(search ? { search } : {})
      .then(r => setShelters(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title"> Притулки</h1>
        <p className="page-subtitle">Знайдіть притулки поруч та допоможіть тваринам</p>
      </div>

      <div style={{ marginBottom: 24 }}>
        <input className="search-input" style={{ maxWidth: 400 }} placeholder="Пошук притулку..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> :
        shelters.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"></div>
            <h3>Притулків не знайдено</h3>
          </div>
        ) : (
          <div className="card-grid card-grid-2">
            {shelters.map(s => (
              <div key={s.id} className="card" style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontFamily: 'Unbounded', fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{s.name}</h3>
                    {s.city && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={13} />{s.city}</div>}
                  </div>
                  {s.is_verified && <span className="badge badge-available"> Верифіковано</span>}
                </div>

                {s.description && <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 14, lineHeight: 1.5 }}>{s.description.slice(0, 120)}{s.description.length > 120 ? '...' : ''}</p>}

                <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEF3C7', borderRadius: 8, padding: '6px 12px' }}>
                    <Footprints size={14} style={{ color: '#B45309' }} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#B45309' }}>{s.animal_count || 0} тварин</span>
                  </div>
                  {s.available_count > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#D1FAE5', borderRadius: 8, padding: '6px 12px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#065F46' }}> {s.available_count} доступно</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                  {s.phone && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Phone size={12} />{s.phone}</span>}
                  {s.email && <span>{s.email}</span>}
                  {s.website && <a href={s.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--primary)' }} onClick={e => e.stopPropagation()}><Globe size={12} />Сайт</a>}
                </div>

                <button className="btn btn-outline btn-sm" style={{ marginTop: 14 }}
                  onClick={() => navigate(`/animals?shelter_id=${s.id}`)}>
                  Переглянути тварин 
                </button>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );
}
