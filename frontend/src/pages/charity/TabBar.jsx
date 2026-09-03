const FONT = "'Plus Jakarta Sans', sans-serif";

export default function TabBar({ tabs, activeTab, onTabChange, activeStyle, activeTextColor = '#fff', inactiveColor = '#2e7d32' }) {
  return (
    <div style={{
      display: 'flex', gap: '8px', marginBottom: '1.5rem',
      overflowX: 'auto', paddingBottom: '4px'
    }}>
      {tabs.map(({ key, label, Icon, badge }) => {
        const active = activeTab === key;
        return (
          <button key={key} onClick={() => onTabChange(key)} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 18px', borderRadius: '12px',
            fontFamily: FONT, fontSize: '0.82rem', fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', border: 'none',
            whiteSpace: 'nowrap',
            background: active ? activeStyle : '#fff',
            color: active ? activeTextColor : inactiveColor,
            boxShadow: active ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            {Icon && <Icon style={{ width: '15px', height: '15px' }} />}
            {label}
            {badge > 0 && (
              <span style={{
                background: active ? 'rgba(255,255,255,0.3)' : '#ef5350',
                color: '#fff', borderRadius: '10px',
                padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700
              }}>
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}