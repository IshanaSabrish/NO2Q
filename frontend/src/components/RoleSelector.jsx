import { User, Store, ShieldCheck } from 'lucide-react';

const RoleSelector = ({ selectedRole, onSelect }) => {
  const roles = [
    { id: 'customer', label: 'Customer', icon: User, desc: 'Join digital queues' },
    { id: 'owner', label: 'Restaurant', icon: Store, desc: 'Manage your tables' },
    { id: 'admin', label: 'Administrator', icon: ShieldCheck, desc: 'System oversight' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
      {roles.map((role) => {
        const Icon = role.icon;
        const isActive = selectedRole === role.id;
        
        return (
          <button
            key={role.id}
            type="button"
            onClick={() => onSelect(role.id)}
            style={{
              position: 'relative',
              padding: '1.5rem 1rem',
              borderRadius: '20px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              background: isActive ? 'var(--primary-green)' : 'var(--pure-white)',
              border: `2px solid ${isActive ? 'var(--primary-green)' : 'var(--border-color)'}`,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transform: isActive ? 'scale(1.03)' : 'scale(1)',
              boxShadow: isActive ? '0 8px 25px rgba(46, 79, 79, 0.25)' : 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{
              padding: '0.85rem',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              background: isActive ? 'rgba(255,255,255,0.15)' : '#F7FAFC',
              color: isActive ? 'white' : 'var(--primary-green)',
            }}>
              <Icon size={28} strokeWidth={2.5} />
            </div>
            
            <div>
              <h4 style={{
                fontSize: '1rem',
                fontWeight: 800,
                marginBottom: '0.15rem',
                color: isActive ? 'white' : 'var(--primary-green)',
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
              }}>
                {role.label}
              </h4>
              <p style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
              }}>
                {role.desc}
              </p>
            </div>

            {isActive && (
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                padding: '3px',
                display: 'flex',
              }}>
                <ShieldCheck size={14} color="white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default RoleSelector;
