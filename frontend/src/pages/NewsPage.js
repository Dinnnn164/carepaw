import React, { useEffect, useState } from 'react';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Eye, Trash2 } from 'lucide-react';

const CAT_LABELS = { news: 'Новини', success_story: 'Успішна історія', event: 'Подія', urgent: 'Терміново' };
const CAT_COLORS = { news: '#DBEAFE', success_story: '#D1FAE5', event: '#FEF3C7', urgent: '#FEE2E2' };
const CAT_TEXT = { news: '#1E40AF', success_story: '#065F46', event: '#92400E', urgent: '#991B1B' };

export default function NewsPage() {
  const { user, isAdmin, isShelterOwner } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'news', image: '' });

  const load = () => {
    setLoading(true);
    postsAPI.getAll(category ? { category } : {})
      .then(r => setPosts(r.data.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [category]);

  const createPost = async (e) => {
    e.preventDefault();
    try {
      await postsAPI.create(form);
      toast.success('Публікацію додано');
      setShowModal(false);
      setForm({ title: '', content: '', category: 'news', image: '' });
      load();
    } catch { toast.error('Помилка'); }
  };

  const deletePost = async (id) => {
    if (!window.confirm('Видалити?')) return;
    try { await postsAPI.delete(id); toast.success('Видалено'); load(); }
    catch { toast.error('Помилка'); }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title"> Новини та події</h1>
          <p className="page-subtitle">Актуальна інформація про тварин та притулки</p>
        </div>
        {(isAdmin || isShelterOwner) && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> Додати публікацію</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['', 'Всі'], ...Object.entries(CAT_LABELS)].map(([v, l]) => (
          <button key={v} className={`btn btn-sm ${category === v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategory(v)}>{l}</button>
        ))}
      </div>

      {loading ? <div className="loader"><div className="spinner" /></div> :
        posts.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon"></div><h3>Публікацій не знайдено</h3></div>
        ) : (
          <div className="card-grid card-grid-3">
            {posts.map(p => (
              <div key={p.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                {p.image && (
                  <div style={{ margin: '-24px -24px 16px', height: 180, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                    <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span className="badge" style={{ background: CAT_COLORS[p.category], color: CAT_TEXT[p.category] }}>
                    {CAT_LABELS[p.category]}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString('uk-UA')}</span>
                </div>
                <h3 style={{ fontFamily: 'Unbounded', fontSize: '0.95rem', fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>{p.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.87rem', lineHeight: 1.5, flex: 1 }}>
                  {p.content.slice(0, 150)}{p.content.length > 150 ? '...' : ''}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {p.author_name} {p.shelter_name ? `• ${p.shelter_name}` : ''}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}><Eye size={12} />{p.views}</span>
                    {(isAdmin || isShelterOwner) && (
                      <button className="btn btn-sm btn-ghost" style={{ color: '#EF4444', padding: '4px 8px' }} onClick={() => deletePost(p.id)}><Trash2 size={13} /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">Нова публікація</h2>
            <form onSubmit={createPost}>
              <div className="form-group">
                <label className="form-label">Категорія</label>
                <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  {Object.entries(CAT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Заголовок *</label>
                <input className="form-control" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Текст *</label>
                <textarea className="form-control" rows={5} required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">URL зображення</label>
                <input className="form-control" placeholder="https://..." value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Скасувати</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Опублікувати</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
