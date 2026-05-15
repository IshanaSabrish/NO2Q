import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/store';
import {
    ShieldCheck, CheckCircle, XCircle, FileText, ImageIcon,
    MapPin, Eye, ExternalLink, Mail, Phone, Clock, Search,
    ChevronRight, LogOut, LayoutDashboard, Settings, UserPlus,
    AlertTriangle, Download, X, ZoomIn, FileCheck, FileX,
    Shield, BadgeCheck, MessageSquareX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─── Reject Reason Modal ─────────────────────────────────────────────────────
const RejectModal = ({ restaurantName, onConfirm, onClose }) => {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) return;
        setSubmitting(true);
        await onConfirm(reason.trim());
        setSubmitting(false);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(4px)',
                zIndex: 4000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                animation: 'fadeIn 0.2s ease',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white', borderRadius: '24px',
                    width: 'min(520px, 96vw)', padding: '2.5rem',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
                    animation: 'scaleIn 0.25s ease',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem' }}>
                    <div style={{
                        width: '48px', height: '48px', borderRadius: '12px',
                        background: '#FFF5F5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <MessageSquareX size={24} color="#E53E3E" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, color: '#E53E3E', fontSize: '1.2rem' }}>Reject Application</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{restaurantName}</p>
                    </div>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Please provide a reason for rejection. The restaurant owner will see this message.
                </p>

                <textarea
                    autoFocus
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="e.g. FSSAI document is expired, GST certificate mismatch, incomplete information..."
                    style={{
                        width: '100%', minHeight: '120px',
                        padding: '1rem', borderRadius: '12px',
                        border: '1.5px solid var(--border-color)',
                        fontFamily: 'inherit', fontSize: '0.95rem',
                        resize: 'vertical', outline: 'none',
                        transition: 'border-color 0.2s',
                        color: 'var(--text-dark)', lineHeight: 1.6,
                        marginBottom: '1.5rem',
                    }}
                    onFocus={e => e.target.style.borderColor = '#E53E3E'}
                    onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={onClose} className="btn btn-outline" style={{ flex: 1, padding: '0.9rem' }}>
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!reason.trim() || submitting}
                        className="btn"
                        style={{
                            flex: 1, padding: '0.9rem',
                            background: reason.trim() ? '#E53E3E' : '#FED7D7',
                            color: 'white', border: 'none',
                            transition: 'background 0.2s',
                        }}
                    >
                        {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const API = 'http://localhost:8000';

// ─── Document Viewer Modal ───────────────────────────────────────────────────
const DocViewerModal = ({ docUrl, docType, restaurantName, restaurantId, onClose }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isImage = docUrl && /\.(png|jpg|jpeg|gif|webp)$/i.test(docUrl);
    const isPdf = docUrl && /\.pdf$/i.test(docUrl);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `${API}/api/admin/download/${restaurantId}/${docType}`;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.72)',
                backdropFilter: 'blur(6px)',
                zIndex: 3000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
                animation: 'fadeIn 0.2s ease',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: '24px',
                    width: 'min(900px, 96vw)',
                    maxHeight: '90vh',
                    display: 'flex', flexDirection: 'column',
                    boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
                    animation: 'scaleIn 0.25s ease',
                    overflow: 'hidden',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid var(--border-color)',
                    background: docType === 'fssai'
                        ? 'linear-gradient(135deg, #EBF8FF 0%, #BEE3F8 100%)'
                        : 'linear-gradient(135deg, #F0FFF4 0%, #C6F6D5 100%)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px',
                            background: docType === 'fssai' ? '#3182CE' : '#38A169',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Shield size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                {docType === 'fssai' ? 'FSSAI License Document' : 'GST Certificate'}
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                {restaurantName}
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button
                            onClick={handleDownload}
                            className="btn btn-primary"
                            style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', gap: '0.4rem' }}
                        >
                            <Download size={16} /> Download
                        </button>
                        <button
                            onClick={onClose}
                            className="btn"
                            style={{
                                padding: '0.6rem', background: 'rgba(0,0,0,0.08)',
                                border: 'none', color: 'var(--text-dark)'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Document Preview Area */}
                <div style={{
                    flex: 1, overflowY: 'auto', background: '#F7FAFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minHeight: '400px', position: 'relative',
                }}>
                    {isImage ? (
                        <img
                            src={docUrl}
                            alt={`${docType} document`}
                            onLoad={() => setLoading(false)}
                            onError={() => { setLoading(false); setError('Unable to load image.'); }}
                            style={{
                                maxWidth: '100%', maxHeight: '70vh',
                                objectFit: 'contain', padding: '1.5rem',
                                display: loading ? 'none' : 'block',
                            }}
                        />
                    ) : (
                        <iframe
                            src={docUrl}
                            title={`${docType} document`}
                            onLoad={() => setLoading(false)}
                            onError={() => { setLoading(false); setError('Unable to load document.'); }}
                            style={{
                                width: '100%', height: '70vh',
                                border: 'none',
                                display: loading ? 'none' : 'block',
                            }}
                        />
                    )}

                    {loading && (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <div className="spinner" style={{ marginBottom: '1rem' }} />
                            <p>Loading document...</p>
                        </div>
                    )}
                    {error && (
                        <div style={{ textAlign: 'center', color: 'var(--red)', padding: '2rem' }}>
                            <FileX size={40} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                            <p style={{ fontWeight: 700 }}>{error}</p>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                                Click <strong>Download</strong> to save the file and open it locally.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Document Badge ──────────────────────────────────────────────────────────
const DocBadge = ({ label, docUrl, docType, restaurantId, restaurantName }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const hasDoc = Boolean(docUrl);

    return (
        <>
            <div style={{
                background: hasDoc ? (docType === 'fssai' ? '#EBF8FF' : '#F0FFF4') : '#F7FAFC',
                border: `1.5px solid ${hasDoc ? (docType === 'fssai' ? '#BEE3F8' : '#C6F6D5') : '#E2E8F0'}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '0.75rem',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                        background: hasDoc ? (docType === 'fssai' ? '#3182CE' : '#38A169') : '#CBD5E0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {hasDoc ? <FileCheck size={18} color="white" /> : <FileX size={18} color="white" />}
                    </div>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                            {label}
                        </p>
                        <p style={{
                            margin: 0, fontSize: '0.85rem', fontWeight: 700,
                            color: hasDoc
                                ? (docType === 'fssai' ? '#2B6CB0' : '#276749')
                                : 'var(--text-muted)',
                        }}>
                            {hasDoc ? 'Document Uploaded' : 'Not Provided'}
                        </p>
                    </div>
                </div>

                {hasDoc && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="btn"
                            title="View Document"
                            style={{
                                padding: '0.45rem 0.85rem', fontSize: '0.75rem', gap: '0.35rem',
                                background: docType === 'fssai' ? '#3182CE' : '#38A169',
                                color: 'white', border: 'none',
                            }}
                        >
                            <Eye size={14} /> View
                        </button>
                        <a
                            href={`${API}/api/admin/download/${restaurantId}/${docType}`}
                            download
                            className="btn"
                            title="Download Document"
                            style={{
                                padding: '0.45rem 0.85rem', fontSize: '0.75rem', gap: '0.35rem',
                                background: '#F7FAFC', color: 'var(--text-dark)',
                                border: '1px solid var(--border-color)',
                                textDecoration: 'none',
                            }}
                        >
                            <Download size={14} /> Save
                        </a>
                    </div>
                )}
            </div>

            {modalOpen && (
                <DocViewerModal
                    docUrl={docUrl}
                    docType={docType}
                    restaurantName={restaurantName}
                    restaurantId={restaurantId}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </>
    );
};

// ─── Active Restaurants List ─────────────────────────────────────────────────
const ActiveRestaurantsList = () => {
    const [active, setActive] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActive = async () => {
            try {
                const res = await axios.get(`${API}/api/admin/active`);
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
        if (confirm('Disable this restaurant?')) {
            try {
                await axios.post(`${API}/api/admin/disable/${id}`);
                setActive(active.filter(r => r._id !== id));
            } catch (err) {
                alert('Action failed');
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

// ─── Admin Dashboard ─────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const logout = useAuthStore(state => state.logout);
    const user = useAuthStore(state => state.user);
    const [activeTab, setActiveTab] = useState('requests');
    const [stats, setStats] = useState({ pending: 0, active: 0 });
    const [rejectTarget, setRejectTarget] = useState(null); // { id, name }
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await axios.get(`${API}/api/admin/requests`);
                setRequests(res.data);

                const allRes = await axios.get(`${API}/api/restaurants/?approved_only=true`);
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
            await axios.post(`${API}/api/admin/approve/${id}`);
            setRequests(requests.filter(r => r._id !== id));
            setStats(prev => ({ ...prev, pending: prev.pending - 1, active: prev.active + 1 }));
            alert('Restaurant approved successfully!');
        } catch (err) {
            alert('Approval failed');
        }
    };

    const handleReject = async (reason) => {
        if (!rejectTarget) return;
        const { id } = rejectTarget;
        try {
            await axios.post(`${API}/api/admin/reject/${id}`, null, {
                params: { reason }
            });
            setRequests(requests.filter(r => r._id !== id));
            setStats(prev => ({ ...prev, pending: prev.pending - 1 }));
            setRejectTarget(null);
        } catch (err) {
            alert('Rejection failed');
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
                                {/* ── Row 1: Basic Info ── */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                                    <img
                                        src={req.images?.[0] || 'https://via.placeholder.com/100'}
                                        style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                                            <h3 style={{ margin: 0 }}>{req.name}</h3>
                                            <span className="badge badge-yellow">Pending Review</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <MapPin size={16} /> {req.location}
                                        </p>
                                        {req.owner_name && (
                                            <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                Owner: <strong>{req.owner_name}</strong>
                                                {req.owner_email && <> &nbsp;·&nbsp; {req.owner_email}</>}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ── Row 2: IDs & Compliance Documents ── */}
                                <div style={{ marginBottom: '2rem' }}>
                                    <p style={{
                                        fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
                                        color: 'var(--text-muted)', letterSpacing: '0.08em',
                                        marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
                                    }}>
                                        <BadgeCheck size={14} /> Compliance Documents
                                    </p>

                                    {/* Registration Numbers */}
                                    <div style={{
                                        background: '#F8F9FA', borderRadius: '12px',
                                        padding: '1rem 1.25rem',
                                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem', marginBottom: '1rem',
                                    }}>
                                        <div>
                                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>FSSAI Number</p>
                                            <p style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem' }}>{req.fssai_number || '—'}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>GST Number</p>
                                            <p style={{ fontWeight: 800, margin: 0, fontSize: '0.9rem' }}>{req.gst_number || '—'}</p>
                                        </div>
                                    </div>

                                    {/* Document View/Download Badges */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <DocBadge
                                            label="FSSAI License"
                                            docUrl={req.fssai}
                                            docType="fssai"
                                            restaurantId={req._id}
                                            restaurantName={req.name}
                                        />
                                        <DocBadge
                                            label="GST Certificate"
                                            docUrl={req.gst}
                                            docType="gst"
                                            restaurantId={req._id}
                                            restaurantName={req.name}
                                        />
                                    </div>
                                </div>

                                {/* ── Row 3: Action Buttons ── */}
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => handleApprove(req._id)}
                                        className="btn btn-primary"
                                        style={{ flex: 1, padding: '1rem' }}
                                    >
                                        <CheckCircle size={18} /> Approve Restaurant
                                    </button>
                                    <button
                                        onClick={() => setRejectTarget({ id: req._id, name: req.name })}
                                        className="btn"
                                        style={{ flex: 1, padding: '1rem', background: '#FFF5F5', color: '#E53E3E', border: '1px solid #FED7D7' }}
                                    >
                                        <XCircle size={18} /> Reject Application
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <ActiveRestaurantsList />
                )}
            </main>

            {rejectTarget && (
                <RejectModal
                    restaurantName={rejectTarget.name}
                    onConfirm={handleReject}
                    onClose={() => setRejectTarget(null)}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
