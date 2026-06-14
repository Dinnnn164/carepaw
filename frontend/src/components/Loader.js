const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: 'var(--bg)'
  }}>
    <div style={{
      width: 48, height: 48, border: '4px solid #f3f3f3',
      borderTop: '4px solid #FF6B35', borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }} />
    <style>{`@keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }`}</style>
  </div>
);