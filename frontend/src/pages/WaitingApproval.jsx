import { useAuthStore } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';

const WaitingApproval = () => {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();

    return (
        <div className="section fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <div className="container">
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem', textAlign: 'center' }}>
                    <div style={{ width: '100px', height: '100px', background: '#FFFBEB', color: '#D97706', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2.5rem' }}>
                        <Clock size={56} className="animate-pulse" />
                    </div>
                    
                    <h1 className="italic-serif" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Verification Pending</h1>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        Hello <span style={{ fontWeight: 800, color: 'var(--primary-green)' }}>{user?._name}</span>, your restaurant documentation is currently under review by our safety team.
                        This usually takes between <span style={{ fontWeight: 800 }}>2 to 4 hours</span>.
                    </p>

                    <div style={{ background: '#F8F9FA', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary-green)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>
                            <ShieldCheck size={18} /> Verification Status
                         </div>
                         
                         <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '12px', height: '12px', background: '#D97706', borderRadius: '50%', boxShadow: '0 0 15px rgba(217, 119, 6, 0.4)' }}></div>
                            <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Reviewing Safety Docs</span>
                         </div>
                         <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>FSSAI & Business License being cross-checked.</p>
                    </div>

                    <button 
                        onClick={() => {
                            logout();
                            navigate('/login');
                        }}
                        className="btn btn-outline"
                        style={{ width: '100%', padding: '1.2rem' }}
                    >
                        <LogOut size={20} style={{ marginRight: '0.8rem' }} /> Sign Out & Refresh
                    </button>
                    
                    <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Need urgent help? <span style={{ color: 'var(--accent-brown)', textDecoration: 'underline', cursor: 'pointer' }}>Contact support</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default WaitingApproval;
