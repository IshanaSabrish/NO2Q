import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/store';
import { LayoutDashboard, Users, Clock, LogOut, CheckCircle, XCircle, Bell, ChevronRight, Monitor, Upload, Trash2, Image, FileText, BarChart3, Plus, Utensils, AlertTriangle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:8000/api';

const OwnerDashboard = () => {
    const user = useAuthStore(state => state.user);
    const logout = useAuthStore(state => state.logout);
    const [restaurant, setRestaurant] = useState(null);
    const [queue, setQueue] = useState([]);
    const [allTokens, setAllTokens] = useState([]);
    const [tables, setTables] = useState([]);
    const [activeTab, setActiveTab] = useState('queue');
    const [analytics, setAnalytics] = useState(null);
    const [newTable, setNewTable] = useState({ number: '', seats: 4 });
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTelegramModal, setShowTelegramModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningToken, setAssigningToken] = useState(null);
    const [telegramChatId, setTelegramChatId] = useState('');
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();
    const wsRef = useRef(null);

    const fetchData = async () => {
        try {
            const restRes = await axios.get(`${API}/restaurants/by-owner/${user.user_id}`);
            setRestaurant(restRes.data);
            const rid = restRes.data._id;
            
            const [qRes, tRes, aRes, allRes] = await Promise.all([
                axios.get(`${API}/queue/restaurant/${rid}`),
                axios.get(`${API}/tables/restaurant/${rid}`),
                axios.get(`${API}/restaurants/${rid}/analytics`),
                axios.get(`${API}/queue/restaurant/${rid}/all`)
            ]);
            
            setQueue(qRes.data);
            setTables(tRes.data);
            setAnalytics(aRes.data);
            setAllTokens(allRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, [user.user_id]);

    // WebSocket
    useEffect(() => {
        if (!restaurant?._id) return;
        try {
            const ws = new WebSocket(`ws://localhost:8000/api/queue/ws/${restaurant._id}`);
            wsRef.current = ws;
            ws.onmessage = () => fetchData();
            return () => { if (ws.readyState === WebSocket.OPEN) ws.close(); };
        } catch (e) {}
    }, [restaurant?._id]);

    const handleStatusUpdate = async (tokenId, status, tableId = null) => {
        try {
            let url = `${API}/queue/${tokenId}/status?status=${status}`;
            if (tableId) url += `&table_id=${tableId}`;
            await axios.post(url);
            fetchData();
            setShowAssignModal(false);
            setAssigningToken(null);
        } catch (err) {
            console.error("Action error:", err);
            const msg = err.response?.data?.detail || "Action failed. Check server logs.";
            alert(msg);
        }
    };

    const updateTableStatus = async (tableId, status) => {
        try {
            await axios.post(`${API}/tables/${tableId}/status?status=${status}`);
            fetchData();
        } catch (err) {
            alert("Failed to update table");
        }
    };

    const handleAddTable = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API}/tables/add`, {
                restaurant_id: restaurant._id,
                number: parseInt(newTable.number),
                seats: parseInt(newTable.seats)
            });
            fetchData();
            setShowAddModal(false);
            setNewTable({ number: '', seats: 4 });
        } catch (err) {
            alert("Failed to add table");
        }
    };

    const handleDeleteTable = async (tableId) => {
        if (!confirm("Delete this table?")) return;
        try {
            await axios.delete(`${API}/tables/${tableId}`);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.detail || "Cannot delete");
        }
    };

    const handleFileUpload = async (file, type) => {
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axios.post(`${API}/upload/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            const url = res.data.url;
            
            if (type === 'photo') {
                await axios.post(`${API}/restaurants/${restaurant._id}/photos?url=${encodeURIComponent(url)}`);
            } else if (type === 'menu') {
                await axios.post(`${API}/restaurants/${restaurant._id}/menu-images?url=${encodeURIComponent(url)}`);
            }
            fetchData();
        } catch (err) {
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleRemovePhoto = async (url) => {
        if (!confirm("Remove this photo?")) return;
        await axios.delete(`${API}/restaurants/${restaurant._id}/photos?url=${encodeURIComponent(url)}`);
        fetchData();
    };

    const handleRemoveMenu = async (url) => {
        if (!confirm("Remove this menu image?")) return;
        await axios.delete(`${API}/restaurants/${restaurant._id}/menu-images?url=${encodeURIComponent(url)}`);
        fetchData();
    };

    const handleLinkTelegram = async () => {
        if (!telegramChatId) return alert("Enter Chat ID");
        try {
            await axios.post(`${API}/auth/link-telegram?user_id=${user.user_id}&chat_id=${telegramChatId}`);
            alert("Telegram linked!");
            setShowTelegramModal(false);
        } catch (err) {
            alert("Failed to link Telegram");
        }
    };

    const emptyTables = tables.filter(t => t.status === 'empty').length;
    const fullTables = tables.filter(t => t.status === 'full').length;
    const cleaningTables = tables.filter(t => t.status === 'cleaning').length;

    const tabs = [
        { id: 'queue', label: 'Live Queue', icon: Users, badge: queue.length },
        { id: 'tables', label: 'Tables', icon: LayoutDashboard },
        { id: 'content', label: 'Content', icon: Image },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="layout-sidebar">
            {/* Sidebar */}
            <aside className="sidebar">
                <div style={{ marginBottom: '2.5rem' }}>
                    <h1 className="logo" style={{ fontSize: '1.8rem' }}>NO2Q<span>+</span></h1>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Owner Command</p>
                </div>

                <nav className="sidebar-nav">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`sidebar-btn ${activeTab === tab.id ? 'active' : ''}`}>
                            <tab.icon size={18} />
                            {tab.label}
                            {tab.badge > 0 && (
                                <span style={{ marginLeft: 'auto', background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'var(--red)', color: 'white', borderRadius: '10px', padding: '0.1rem 0.5rem', fontSize: '0.7rem', fontWeight: 800 }}>{tab.badge}</span>
                            )}
                        </button>
                    ))}
                    <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
                    <button onClick={() => navigate('/owner/display')} className="sidebar-btn">
                        <Monitor size={18} /> Public Display
                    </button>
                    <button onClick={() => setShowTelegramModal(true)} className="sidebar-btn" style={{ color: '#0088cc' }}>
                        <Bell size={18} /> Telegram Alerts
                    </button>
                </nav>

                <button onClick={() => { logout(); navigate('/login'); }} className="sidebar-btn" style={{ color: 'var(--red)', marginTop: 'auto' }}>
                    <LogOut size={18} /> Sign Out
                </button>
            </aside>

            {/* Main */}
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', marginBottom: '0.3rem' }} className="italic-serif">{restaurant?.name || "Dashboard"}</h2>
                        <p style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem' }}>Welcome back</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="stat-card" style={{ minWidth: '120px' }}>
                            <div className="stat-label">Queue</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{queue.length}</div>
                        </div>
                        <div className="stat-card" style={{ minWidth: '120px' }}>
                            <div className="stat-label">Tables Free</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--green)' }}>{emptyTables}/{tables.length}</div>
                        </div>
                        <div className="stat-card" style={{ minWidth: '120px' }}>
                            <div className="stat-label">Avg Wait</div>
                            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{analytics?.average_wait_time || 0}m</div>
                        </div>
                    </div>
                </header>

                {/* ─── QUEUE TAB ─── */}
                {activeTab === 'queue' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Active Queue</h3>
                            <span className="badge badge-green">{queue.length} in queue</span>
                        </div>
                        
                        {queue.length === 0 ? (
                            <div className="empty-state">
                                <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                                <h4>No customers in queue</h4>
                                <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Waiting for new bookings...</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {queue.map((t) => (
                                    <div key={t._id} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="token-badge">
                                                <span>TOKEN</span>
                                                <span>{t.token_number}</span>
                                            </div>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{t.customer_name}</h4>
                                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Users size={12} /> {t.group_size} guests • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {t.assigned_table_number && <span style={{ color: 'var(--green)' }}> • Table {t.assigned_table_number}</span>}
                                                </p>
                                            </div>
                                            <span className={`badge ${t.status === 'waiting' ? 'badge-blue' : t.status === 'called' ? 'badge-green' : 'badge-yellow'}`}>
                                                {t.status}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            {t.status === 'waiting' && (
                                                <button onClick={() => handleStatusUpdate(t._id, 'called')} className="btn" style={{ background: 'var(--accent-brown)', color: 'white', padding: '0.6rem' }} title="Call Customer">
                                                    <Bell size={16} />
                                                </button>
                                            )}
                                            {(t.status === 'waiting' || t.status === 'called' || t.status === 'delayed') && (
                                                <button onClick={() => { setAssigningToken(t); setShowAssignModal(true); }} className="btn btn-success" style={{ padding: '0.6rem' }} title="Start Dining">
                                                    <Utensils size={16} />
                                                </button>
                                            )}
                                            {t.status === 'dining' && (
                                                <button onClick={() => handleStatusUpdate(t._id, 'completed')} className="btn" style={{ background: 'var(--primary-green)', color: 'white', padding: '0.6rem' }} title="Complete Dining">
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            {t.status !== 'completed' && t.status !== 'cancelled' && (
                                                <button onClick={() => handleStatusUpdate(t._id, 'no_show')} className="btn btn-danger" style={{ padding: '0.6rem' }} title="No Show">
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recent History */}
                        {allTokens.filter(t => ['completed', 'cancelled', 'no_show'].includes(t.status)).length > 0 && (
                            <div style={{ marginTop: '2.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Recent History</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {allTokens.filter(t => ['completed', 'cancelled', 'no_show'].includes(t.status)).slice(0, 10).map(t => (
                                        <div key={t._id} style={{ padding: '0.75rem 1rem', background: '#FAFBFC', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--primary-green)' }}>{t.token_number}</span>
                                                <span>{t.customer_name}</span>
                                                <span style={{ color: 'var(--text-muted)' }}>{t.group_size}p</span>
                                            </div>
                                            <span className={`badge ${t.status === 'completed' ? 'badge-green' : 'badge-red'}`}>{t.status}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TABLES TAB ─── */}
                {activeTab === 'tables' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h3 style={{ margin: 0 }}>Table Layout</h3>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                    🟢 {emptyTables} Empty • 🔴 {fullTables} Full • 🟡 {cleaningTables} Cleaning
                                </p>
                            </div>
                            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                                <Plus size={16} /> Add Table
                            </button>
                        </div>

                        {showAddModal && (
                            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#FAFBFC' }}>
                                <form onSubmit={handleAddTable} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                                    <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                                        <label className="input-label">Table #</label>
                                        <input required type="number" className="input" placeholder="e.g. 15" value={newTable.number} onChange={e => setNewTable({ ...newTable, number: e.target.value })} />
                                    </div>
                                    <div className="input-group" style={{ marginBottom: 0, flex: 1 }}>
                                        <label className="input-label">Seats</label>
                                        <input required type="number" min="1" className="input" value={newTable.seats} onChange={e => setNewTable({ ...newTable, seats: e.target.value })} />
                                    </div>
                                    <button type="submit" className="btn btn-primary">Save</button>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline">Cancel</button>
                                </form>
                            </div>
                        )}

                        <div className="grid grid-cols-4">
                            {tables.map(tbl => {
                                const colors = {
                                    empty: { border: 'var(--green)', bg: 'white', numBg: 'var(--green-bg)', numColor: '#2F855A' },
                                    full: { border: 'var(--red)', bg: 'var(--red-bg)', numBg: 'var(--red-bg)', numColor: '#C53030' },
                                    cleaning: { border: 'var(--yellow)', bg: 'var(--yellow-bg)', numBg: 'var(--yellow-bg)', numColor: '#B7791F' }
                                };
                                const c = colors[tbl.status] || colors.empty;
                                
                                return (
                                    <div key={tbl._id} className="card table-card" style={{ borderTop: `6px solid ${c.border}`, background: c.bg }}>
                                        <div className="table-number" style={{ background: c.numBg, color: c.numColor }}>{tbl.number}</div>
                                        <h4 style={{ margin: '0 0 0.15rem', fontSize: '0.95rem' }}>Table {tbl.number}</h4>
                                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 700 }}>{tbl.seats} SEATS</p>
                                        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                                            <button onClick={() => updateTableStatus(tbl._id, 'empty')} className="btn" style={{ flex: 1, padding: '0.35rem', fontSize: '0.6rem', fontWeight: 800, background: tbl.status === 'empty' ? 'var(--green)' : 'white', color: tbl.status === 'empty' ? 'white' : 'var(--green)', border: '1px solid var(--green)' }}>FREE</button>
                                            <button onClick={() => updateTableStatus(tbl._id, 'cleaning')} className="btn" style={{ flex: 1, padding: '0.35rem', fontSize: '0.6rem', fontWeight: 800, background: tbl.status === 'cleaning' ? 'var(--yellow)' : 'white', color: tbl.status === 'cleaning' ? 'white' : 'var(--yellow)', border: '1px solid var(--yellow)' }}>CLEAN</button>
                                            <button onClick={() => updateTableStatus(tbl._id, 'full')} className="btn" style={{ flex: 1, padding: '0.35rem', fontSize: '0.6rem', fontWeight: 800, background: tbl.status === 'full' ? 'var(--red)' : 'white', color: tbl.status === 'full' ? 'white' : 'var(--red)', border: '1px solid var(--red)' }}>FULL</button>
                                        </div>
                                        <button onClick={() => handleDeleteTable(tbl._id)} style={{ background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'inherit' }}>
                                            <Trash2 size={12} /> Remove
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ─── CONTENT TAB ─── */}
                {activeTab === 'content' && (
                    <div>
                        <h3 style={{ marginBottom: '1.5rem' }}>Content Management</h3>

                        {/* Photos */}
                        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Image size={18} /> Restaurant Photos</h4>
                                <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                                    <Upload size={14} /> Upload
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0], 'photo')} />
                                </label>
                            </div>
                            {uploading && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Uploading...</p>}
                            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                {(restaurant?.images || []).map((img, i) => (
                                    <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                                        <button onClick={() => handleRemovePhoto(img)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Menu */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} /> Menu Images</h4>
                                <label className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.8rem' }}>
                                    <Upload size={14} /> Upload
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e.target.files[0], 'menu')} />
                                </label>
                            </div>
                            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                                {(restaurant?.menu_images || []).map((img, i) => (
                                    <div key={i} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                                        <img src={img} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                                        <button onClick={() => handleRemoveMenu(img)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <XCircle size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── ANALYTICS TAB ─── */}
                {activeTab === 'analytics' && analytics && (
                    <div className="fade-in">
                        <h3 style={{ marginBottom: '1.5rem' }}>Analytics Overview</h3>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                            <div className="stat-card">
                                <div className="stat-label">Tokens Today</div>
                                <div className="stat-value">{analytics.today_tokens}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Completed</div>
                                <div className="stat-value" style={{ color: 'var(--green)' }}>{analytics.completed_tokens}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">No-Shows</div>
                                <div className="stat-value" style={{ color: 'var(--red)' }}>{analytics.no_shows}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Avg Wait Time</div>
                                <div className="stat-value">{analytics.average_wait_time}m</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Peak Hours</div>
                                <div className="stat-value" style={{ fontSize: '1.2rem' }}>{analytics.peak_hours}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Total Sales (Est)</div>
                                <div className="stat-value" style={{ color: 'var(--accent-brown)' }}>${analytics.total_sales_estimate}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Active Queue</div>
                                <div className="stat-value">{analytics.active_queue}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── SETTINGS TAB (QR CODE) ─── */}
                {activeTab === 'settings' && (
                    <div className="fade-in">
                        <h3 style={{ marginBottom: '1.5rem' }}>Management & QR Code</h3>
                        <div className="grid grid-cols-2">
                           <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                                <div style={{ background: '#F8F9FA', padding: '1.5rem', borderRadius: '20px', display: 'inline-block', marginBottom: '1.5rem' }}>
                                    {/* Using a placeholder for QR generation since we don't have a QR generator library imported yet, but we'll show the token */}
                                    <div style={{ width: '180px', height: '180px', margin: '0 auto', background: 'var(--primary-green)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', padding: '1rem' }}>
                                        <Monitor size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                        <p style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>Scan for Queue</p>
                                        <p style={{ fontSize: '0.9rem', fontWeight: 900 }}>{restaurant?.qr_code || 'PENDING'}</p>
                                    </div>
                                </div>
                                <h4>Restaurant QR Code</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Print this and place it at your entrance for customers to scan.</p>
                                <button className="btn btn-primary" onClick={() => window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${restaurant?.qr_code}`, '_blank')}>
                                    Download High-Res QR
                                </button>
                           </div>

                           <div className="card" style={{ padding: '2rem' }}>
                                <h4>System Integration</h4>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Configure external notification and display settings.</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <button onClick={() => setShowTelegramModal(true)} className="btn btn-outline" style={{ color: '#0088cc', borderColor: '#0088cc', width: '100%' }}>
                                        <Bell size={18} /> Manage Telegram Alerts
                                    </button>
                                    <button onClick={() => navigate('/owner/display')} className="btn btn-outline" style={{ width: '100%' }}>
                                        <Monitor size={18} /> Open Public Display
                                    </button>
                                </div>
                           </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Assignment Modal */}
            {showAssignModal && assigningToken && (
                <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
                    <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Assign Table</h3>
                            <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle size={20}/></button>
                        </div>
                        
                        <div style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '10px', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{assigningToken.customer_name}</h4>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Group of {assigningToken.group_size}</p>
                                </div>
                                <div className="token-badge">
                                    <span>TOKEN</span>
                                    <span>{assigningToken.token_number}</span>
                                </div>
                            </div>
                        </div>

                        <h4 style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>Select Table(s)</h4>
                        <div className="grid grid-cols-4" style={{ gap: '0.5rem', maxHeight: '200px', overflowY: 'auto', padding: '0.2rem' }}>
                            {tables.filter(tbl => tbl.status === 'empty').map(tbl => (
                                <button 
                                    key={tbl._id} 
                                    onClick={() => handleStatusUpdate(assigningToken._id, 'dining', tbl._id)}
                                    className="btn btn-outline"
                                    style={{ padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <span style={{ fontWeight: 800, fontSize: '1.2rem' }}>{tbl.number}</span>
                                    <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{tbl.seats} S</span>
                                </button>
                            ))}
                        </div>

                        {tables.filter(tbl => tbl.status === 'empty').length === 0 && (
                            <p style={{ textAlign: 'center', color: 'var(--red)', fontSize: '0.85rem', margin: '1rem 0' }}>No empty tables available.</p>
                        )}

                        <div style={{ borderTop: '1px solid var(--border-color)', margin: '1.5rem 0' }}></div>
                        
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button 
                                onClick={() => handleStatusUpdate(assigningToken._id, 'dining')} 
                                className="btn btn-primary" 
                                style={{ flex: 1 }}
                            >
                                Auto Assign Best Fit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Telegram Modal */}
            {showTelegramModal && (
                <div className="modal-overlay" onClick={() => setShowTelegramModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '0.5rem' }}>Link Telegram Notifications</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Get instant free alerts for new tokens and status changes!</p>
                        <ol style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', marginBottom: '1.5rem', lineHeight: 2 }}>
                            <li>Search for <strong>@NO2Q_Bot</strong> in Telegram</li>
                            <li>Type <strong>/start</strong> to get your Chat ID</li>
                            <li>Enter it below:</li>
                        </ol>
                        <input className="input" placeholder="Your Chat ID (e.g. 12345678)" value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} style={{ marginBottom: '1.5rem' }} />
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={handleLinkTelegram} className="btn btn-primary" style={{ flex: 1 }}>Connect</button>
                            <button onClick={() => setShowTelegramModal(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
