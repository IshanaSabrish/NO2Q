import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/store';
import { useNavigate } from 'react-router-dom';
import { Clock, LogOut, ShieldCheck, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8000';

const WaitingApproval = () => {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const navigate = useNavigate();
    const [restaurant, setRestaurant] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!user?.user_id) { setChecking(false); return; }
        const fetchStatus = async () => {
            try {
                const res = await axios.get(`${API}/api/restaurants/by-owner/${user.user_id}`);
                setRestaurant(res.data);
            } catch (_) {
                // not yet created or error – stay in pending view
            } finally {
                setChecking(false);
            }
        };
        fetchStatus();
    }, [user]);

    const isRejected = restaurant?.disabled === true && restaurant?.rejection_reason;

    if (checking) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        );
    }

    // ── Rejected State ──────────────────────────────────────────────────────
    if (isRejected) {
        return (
            <div className="section fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
                <div className="container">
                    <div className="card" style={{ maxWidth: '620px', margin: '0 auto', padding: '4rem', textAlign: 'center' }}>
                        {/* Icon */}
                        <div style={{
                            width: '100px', height: '100px',
                            background: '#FFF5F5', color: '#E53E3E',
                            borderRadius: '50%', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 2.5rem',
                        }}>
                            <XCircle size={56} />
                        </div>

                        <h1 className="italic-serif" style={{ fontSize: '2.8rem', marginBottom: '1rem', color: '#E53E3E' }}>
                            Application Rejected
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '2.5rem', lineHeight: 1.7 }}>
                            Hello <span style={{ fontWeight: 800, color: 'var(--primary-green)' }}>{user?.name}</span>,
                            your restaurant registration for <strong>{restaurant?.name}</strong> was not approved at this time.
                        </p>

                        {/* Reason Box */}
                        <div style={{
                            background: '#FFF5F5',
                            border: '1.5px solid #FED7D7',
                            borderRadius: '16px',
                            padding: '1.75rem',
                            marginBottom: '2.5rem',
                            textAlign: 'left',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                color: '#E53E3E', fontWeight: 800,
                                textTransform: 'uppercase', fontSize: '0.72rem',
                                letterSpacing: '1.5px', marginBottom: '1rem',
                            }}>
                                <AlertTriangle size={16} /> Reason for Rejection
                            </div>
                            <p style={{ margin: 0, fontSize: '1rem', color: '#742A2A', fontWeight: 600, lineHeight: 1.7 }}>
                                {restaurant.rejection_reason}
                            </p>
                        </div>

                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            Please address the issue above and register again with the correct documents.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                onClick={() => { logout(); navigate('/signup'); }}
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.1rem' }}
                            >
                                Re-apply with correct documents
                            </button>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                className="btn btn-outline"
                                style={{ width: '100%', padding: '1rem' }}
                            >
                                <LogOut size={18} /> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── Pending State ───────────────────────────────────────────────────────
    return (
        <div className="section fade-in" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
            <div className="container">
                <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '4rem', textAlign: 'center' }}>
                    <div style={{
                        width: '100px', height: '100px',
                        background: '#FFFBEB', color: '#D97706',
                        borderRadius: '50%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 2.5rem',
                    }}>
                        <Clock size={56} className="animate-pulse" />
                    </div>

                    <h1 className="italic-serif" style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>Verification Pending</h1>

                    <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
                        Hello <span style={{ fontWeight: 800, color: 'var(--primary-green)' }}>{user?.name}</span>,
                        your restaurant documentation is currently under review by our safety team.
                        This usually takes between <span style={{ fontWeight: 800 }}>2 to 4 hours</span>.
                    </p>

                    <div style={{ background: '#F8F9FA', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', marginBottom: '3rem', textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--primary-green)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '2px', marginBottom: '1.5rem' }}>
                            <ShieldCheck size={18} /> Verification Status
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '12px', height: '12px', background: '#D97706', borderRadius: '50%', boxShadow: '0 0 15px rgba(217,119,6,0.4)' }}></div>
                            <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>Reviewing Safety Docs</span>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>FSSAI &amp; Business License being cross-checked.</p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '1.1rem', marginBottom: '0.75rem' }}
                    >
                        <RefreshCw size={18} /> Check Status
                    </button>

                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        className="btn btn-outline"
                        style={{ width: '100%', padding: '1rem' }}
                    >
                        <LogOut size={20} /> Sign Out &amp; Refresh
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
