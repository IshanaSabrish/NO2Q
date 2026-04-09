import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/store';
import { ShieldCheck, CheckCircle, XCircle, FileText, ImageIcon, MapPin, Eye, ExternalLink, Mail, Phone, Clock, Search, ChevronRight, LogOut, LayoutDashboard, Settings, UserPlus, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ActiveRestaurantsList = () => {
    const [active, setActive] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActive = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/admin/active');
                setActive(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchActive();
    }, []);

    const handleDisable = async (id) => {
        if (confirm("Disable this restaurant?")) {
            try {
                await axios.post(`http://localhost:8000/api/admin/disable/${id}`);
                setActive(active.filter(r => r._id !== id));
            } catch (err) {
                alert("Action failed");
            }
        }
    };

    if (loading) return <div className="p-8 text-center">Loading active partners...</div>;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {active.length === 0 ? (
                <div className="card" style={{ gridColumn: '1/-1', padding: '3rem', textAlign: 'center' }}>
                    <p>No active restaurants found.</p>
                </div>
            ) : active.map(rest => (
                <div key={rest._id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                        <img src={rest.images?.[0] || 'https://via.placeholder.com/100'} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                        <div>
                            <h4 style={{ margin: '0 0 0.25rem 0' }}>{rest.name}</h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rest.location}</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                        <div style={{ background: '#F8F9FA', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>Queue</p>
                            <p style={{ fontWeight: 800, margin: 0 }}>{rest.active_queue || 0}</p>
                        </div>
                        <div style={{ background: '#F8F9FA', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 0.25rem 0' }}>Tables</p>
                            <p style={{ fontWeight: 800, margin: 0 }}>{rest.empty_tables}/{rest.total_tables}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => window.open(`http://localhost:5173/restaurant/${rest._id}`, '_blank')} className="btn btn-outline" style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}>
                            View
                        </button>
                        <button onClick={() => handleDisable(rest._id)} className="btn" style={{ background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FED7D7', padding: '0.5rem', fontSize: '0.75rem' }}>
                            Disable
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);
    const [activeTab, setActiveTab] = useState('requests'); // requests, active, system
    const [stats, setStats] = useState({ pending: 0, active: 0, revenue: '$24.5k' });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await axios.get('http://localhost:8000/api/admin/requests');
                setRequests(res.data);
                
                const allRes = await axios.get('http://localhost:8000/api/restaurants/?approved_only=true');
                setStats(prev => ({ ...prev, active: allRes.data.length, pending: res.data.length }));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const handleApprove = async (id) => {
        try {
            await axios.post(`http://localhost:8000/api/admin/approve/${id}`);
            setRequests(requests.filter(r => r._id !== id));
            setStats(prev => ({ ...prev, pending: prev.pending - 1, active: prev.active + 1 }));
            alert("Restaurant approved successfully!");
        } catch (err) {
            alert("Approval failed");
        }
    };

    const handleReject = async (id) => {
        try {
            await axios.post(`http://localhost:8000/api/admin/disable/${id}`);
            setRequests(requests.filter(r => r._id !== id));
            setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
            alert("Restaurant rejected");
        } catch (err) {
            alert("Rejection failed");
        }
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream-white)' }}>
            {/* Sidebar */}
            <aside style={{ width: '280px', background: 'var(--pure-white)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 className="logo" style={{ fontSize: '2rem' }}>NO2Q+</h1>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Global Oversight</p>
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button onClick={() => setActiveTab('requests')} className={`btn ${activeTab === 'requests' ? 'btn-primary' : 'btn-outline'}`} style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                        <FileText size={18} style={{ marginRight: '0.8rem' }} /> Verifications
                        {stats.pending > 0 && <span style={{ marginLeft: 'auto', background: '#E53E3E', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>{stats.pending}</span>}
                    </button>
                    <button onClick={() => setActiveTab('active')} className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline'}`} style={{ justifyContent: 'flex-start', padding: '1rem' }}>
                        <ShieldCheck size={18} style={{ marginRight: '0.8rem' }} /> Active Partners
                    </button>
                </nav>

                <button onClick={() => { logout(); navigate('/login'); }} className="btn" style={{ padding: '1rem', color: '#E53E3E', border: '1px solid #FED7D7', background: '#FFF5F5', justifyContent: 'flex-start' }}>
                    <LogOut size={18} style={{ marginRight: '0.8rem' }} /> Admin Logout
                </button>
            </aside>

            {/* Main Area */}
            <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} className="italic-serif">Administrator Dashboard</h2>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>System Health: Operational</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div className="card" style={{ padding: '1.5rem', minWidth: '150px', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Pending</p>
                            <h3 style={{ margin: 0, color: '#E53E3E' }}>{stats.pending}</h3>
                        </div>
                    </div>
                </header>

                {activeTab === 'requests' ? (
                    <div className="grid grid-cols-1" style={{ gap: '2rem' }}>
                        {loading ? (
                            <div className="section text-center italic-serif">Fetching partner requests...</div>
                        ) : requests.length === 0 ? (
                            <div className="card" style={{ padding: '4rem', textAlign: 'center', opacity: 0.5 }}>
                                <CheckCircle size={48} style={{ margin: '0 auto 1.5rem' }} />
                                <h3>No Pending Verifications</h3>
                                <p>All restaurant partners have been processed.</p>
                            </div>
                        ) : requests.map(req => (
                            <div key={req._id} className="card" style={{ padding: '2.5rem' }}>
                                <div className="grid grid-cols-2" style={{ gap: '3rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                            <img src={req.images?.[0] || 'https://via.placeholder.com/100'} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                                            <div>
                                                <h3 style={{ marginBottom: '0.3rem' }}>{req.name}</h3>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <MapPin size={16} /> {req.location}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ background: '#F8F9FA', padding: '1.5rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>FSSAI ID</p>
                                                <p style={{ fontWeight: 800 }}>{req.fssai_number}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.3rem' }}>GST ID</p>
                                                <p style={{ fontWeight: 800 }}>{req.gst_number || "NOT GIVEN"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1rem' }}>
                                        <button onClick={() => handleApprove(req._id)} className="btn btn-primary" style={{ padding: '1.2rem' }}>
                                            Approve Restaurant
                                        </button>
                                        <button onClick={() => handleReject(req._id)} className="btn" style={{ padding: '1rem', background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FED7D7' }}>
                                            Reject Application
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                     <ActiveRestaurantsList />
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;
