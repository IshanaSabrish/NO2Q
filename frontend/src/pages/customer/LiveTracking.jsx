import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Clock, RefreshCcw, Users, MapPin, ArrowLeft, XCircle, Bell, Utensils, CheckCircle2, AlertTriangle } from 'lucide-react';

const API = 'http://localhost:8000/api';

const LiveTracking = () => {
    const { tokenId } = useParams();
    const [token, setToken] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();
    const wsRef = useRef(null);

    const fetchToken = async () => {
        try {
            const res = await axios.get(`${API}/queue/token/${tokenId}`);
            setToken(res.data);
            
            if (res.data.restaurant_id && !restaurant) {
                const restRes = await axios.get(`${API}/restaurants/${res.data.restaurant_id}`);
                setRestaurant(restRes.data);
            }
        } catch (err) {
            console.error("Token fetch fail", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch + polling
    useEffect(() => {
        fetchToken();
        const timer = setInterval(fetchToken, 15000); // Poll every 15s
        return () => clearInterval(timer);
    }, [tokenId]);

    // WebSocket for real-time updates
    useEffect(() => {
        if (!token?.restaurant_id) return;
        
        try {
            const ws = new WebSocket(`ws://localhost:8000/api/queue/ws/${token.restaurant_id}`);
            wsRef.current = ws;
            
            ws.onmessage = (event) => {
                const payload = JSON.parse(event.data);
                if (payload.event === 'status_update' || payload.event === 'new_token' || payload.event === 'token_cancelled') {
                    fetchToken(); // Refresh on any queue change
                }
            };
            
            ws.onerror = () => console.log("WebSocket error - falling back to polling");
            
            return () => {
                if (ws.readyState === WebSocket.OPEN) ws.close();
            };
        } catch (e) {
            console.log("WebSocket not available, using polling");
        }
    }, [token?.restaurant_id]);

    // Countdown timer
    useEffect(() => {
        if (!token || token.estimated_time_mins <= 0) return;
        
        const createdAt = new Date(token.created_at).getTime();
        const estimatedEnd = createdAt + (token.estimated_time_mins * 60 * 1000);
        
        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.floor((estimatedEnd - Date.now()) / 1000));
            setCountdown(remaining);
        }, 1000);
        
        return () => clearInterval(interval);
    }, [token]);

    const handleCancel = async () => {
        if (confirm("Are you sure you want to cancel your token?")) {
            try {
                await axios.post(`${API}/queue/${tokenId}/cancel`);
                alert("Token cancelled successfully.");
                navigate('/home');
            } catch (err) {
                alert(err.response?.data?.detail || "Cancellation failed");
            }
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return (
        <div className="section text-center" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div><div className="spinner" style={{ marginBottom: '1rem' }}></div><p className="italic-serif" style={{ color: 'var(--primary-green)' }}>Syncing with queue...</p></div>
        </div>
    );

    if (!token) return (
        <div className="section text-center">
            <h2 style={{ color: 'var(--red)' }}>Token not found</h2>
            <button onClick={() => navigate('/home')} className="btn btn-primary mt-8">Return Home</button>
        </div>
    );

    const getStatusConfig = () => {
        switch (token.status) {
            case 'waiting': return { label: 'In Queue', color: 'var(--primary-green)', bg: '#F0FFF4', icon: Clock, desc: 'Please wait for your turn' };
            case 'called': return { label: 'Your Turn!', color: 'var(--green)', bg: '#F0FFF4', icon: Bell, desc: 'Please come to the entrance' };
            case 'delayed': return { label: 'Please Hurry', color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: AlertTriangle, desc: 'You\'ve been moved down. Arrive soon!' };
            case 'dining': return { label: 'Dining Now', color: 'var(--green)', bg: '#ECFDF5', icon: Utensils, desc: 'Enjoy your meal!' };
            case 'completed': return { label: 'Completed', color: 'var(--text-muted)', bg: '#F8F9FA', icon: CheckCircle2, desc: 'Thank you for dining with us' };
            case 'cancelled': return { label: 'Cancelled', color: 'var(--red)', bg: 'var(--red-bg)', icon: XCircle, desc: 'This token has been cancelled' };
            case 'no_show': return { label: 'No Show', color: 'var(--red)', bg: 'var(--red-bg)', icon: XCircle, desc: 'Token cancelled due to no arrival' };
            default: return { label: token.status, color: 'var(--text-muted)', bg: '#F8F9FA', icon: Clock, desc: '' };
        }
    };

    const status = getStatusConfig();
    const StatusIcon = status.icon;
    const isActive = ['waiting', 'called', 'delayed'].includes(token.status);

    return (
        <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--cream-white)' }}>
            <nav className="nav">
                <div className="container nav-content">
                    <button onClick={() => navigate('/home')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        <ArrowLeft size={14} /> Home
                    </button>
                    <h1 className="logo" style={{ fontSize: '1.4rem' }}>Live Track</h1>
                    <button onClick={fetchToken} className="btn" style={{ background: '#F8F9FA', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '10px' }}>
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </nav>

            <div className="container" style={{ padding: '1.5rem', maxWidth: '580px', margin: '0 auto' }}>
                {/* Restaurant Brief */}
                {restaurant && (
                    <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '1.2rem', marginBottom: '1.5rem' }}>
                        <img src={restaurant.images?.[0] || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=100'} 
                             style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', marginRight: '1rem' }} alt="" />
                        <div>
                            <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{restaurant.name}</h4>
                            <p style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                                <MapPin size={12} style={{ marginRight: '0.3rem', color: 'var(--accent-brown)' }} /> {restaurant.location}
                            </p>
                        </div>
                    </div>
                )}

                {/* Token Hub */}
                <div className="card" style={{ textAlign: 'center', borderTop: `5px solid ${status.color}` }}>
                    <div className="p-6">
                        <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.75rem', letterSpacing: '2px' }}>Personal Token</p>
                        <h2 style={{ fontSize: '4rem', lineHeight: 1, marginBottom: '1.5rem', color: 'var(--primary-green)' }}>{token.token_number}</h2>
                        
                        {/* Position & Wait */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{ background: '#F8F9FA', padding: '1.2rem', borderRadius: '14px' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Position</p>
                                <h4 style={{ fontSize: '1.8rem', margin: 0 }}>#{token.position}</h4>
                            </div>
                            <div style={{ background: '#F8F9FA', padding: '1.2rem', borderRadius: '14px' }}>
                                <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                                    {countdown > 0 ? 'Countdown' : 'Est. Wait'}
                                </p>
                                <h4 style={{ fontSize: '1.8rem', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                                    {countdown > 0 ? formatTime(countdown) : `${token.estimated_time_mins}m`}
                                </h4>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div style={{ 
                            background: status.bg, 
                            color: status.color, 
                            padding: '0.9rem 1.5rem', 
                            borderRadius: '14px', 
                            fontWeight: 800, 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            <StatusIcon size={18} />
                            {status.label.toUpperCase()}
                        </div>
                        {status.desc && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{status.desc}</p>
                        )}

                        {/* Table Assignment */}
                        {token.assigned_table_number && (
                            <div style={{ marginTop: '1rem', background: 'var(--green-bg)', border: '1px solid var(--green-border)', borderRadius: '12px', padding: '1rem' }}>
                                <p style={{ fontWeight: 800, color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: 0 }}>
                                    <Utensils size={16} /> Assigned to Table {token.assigned_table_number}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Footer Info */}
                    <div style={{ background: 'var(--primary-green)', padding: '1.2rem', display: 'flex', justifyContent: 'space-around', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                            <Users size={14} /> {token.group_size} Guests
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700 }}>
                            <Clock size={14} /> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                {isActive && (
                    <div style={{ marginTop: '1.5rem' }}>
                        <div className="card" style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h4 style={{ fontSize: '1rem', margin: 0 }}>Plans Changed?</h4>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Cancel to free up the queue spot.</p>
                            </div>
                            <button onClick={handleCancel} className="btn btn-danger" style={{ fontSize: '0.8rem' }}>
                                <XCircle size={15} /> Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Called Status - Grace Period Warning */}
                {token.status === 'called' && (
                    <div className="card" style={{ marginTop: '1rem', padding: '1.2rem', background: 'var(--green-bg)', border: '1px solid var(--green-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--green)', fontWeight: 800, marginBottom: '0.5rem' }}>
                            <Bell size={16} className="animate-pulse" /> Your table is ready!
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            Please arrive within <strong>10 minutes</strong> or you may be moved down. Token auto-cancels after 20 minutes.
                        </p>
                    </div>
                )}

                {token.status === 'delayed' && (
                    <div className="card" style={{ marginTop: '1rem', padding: '1.2rem', background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--yellow)', fontWeight: 800, marginBottom: '0.5rem' }}>
                            <AlertTriangle size={16} /> You've been moved down
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                            You didn't arrive on time. Please come now or your token will be cancelled automatically.
                        </p>
                    </div>
                )}

                <p className="text-center" style={{ margin: '3rem 0 2rem', fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '3px' }}>
                    NO2Q+ Smart Queue Engine • Auto-refreshing
                </p>
            </div>
        </div>
    );
};

export default LiveTracking;
