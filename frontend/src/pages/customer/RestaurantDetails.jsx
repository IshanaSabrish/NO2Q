import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore, useQueueStore } from '../../store/store';
import {
    MapPin, Clock, Users, ArrowLeft, ChevronRight, CheckCircle2,
    Star, Utensils, FileText, AlertCircle, Coffee, RefreshCw
} from 'lucide-react';

const API = 'http://localhost:8000/api';

/* ── tiny colour helpers ── */
const TABLE_COLORS = {
    empty:    { bg: '#ECFDF5', border: '#10B981', text: '#065F46', label: 'Available' },
    full:     { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', label: 'Occupied'  },
    cleaning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', label: 'Cleaning'  },
};

/* ── single table card ── */
const TableCard = ({ table }) => {
    const c = TABLE_COLORS[table.status] || TABLE_COLORS.empty;
    return (
        <div style={{
            border: `2px solid ${c.border}`,
            background: c.bg,
            borderRadius: '14px',
            padding: '1rem 0.75rem',
            textAlign: 'center',
            transition: 'transform 0.2s ease',
            cursor: 'default',
        }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>
                {table.status === 'empty' ? '🪑' : table.status === 'full' ? '🍽️' : '🧹'}
            </div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: c.text }}>
                Table {table.number}
            </div>
            <div style={{ fontSize: '0.72rem', color: c.text, fontWeight: 600, marginTop: '0.2rem' }}>
                {table.seats} seat{table.seats !== 1 ? 's' : ''}
            </div>
            <div style={{
                marginTop: '0.5rem',
                display: 'inline-block',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: c.border,
                color: 'white',
            }}>
                {c.label}
            </div>
        </div>
    );
};

const RestaurantDetails = () => {
    const { id } = useParams();
    const [restaurant, setRestaurant]   = useState(null);
    const [tables, setTables]           = useState([]);
    const [availability, setAvailability] = useState(null); // result from /availability
    const [loading, setLoading]         = useState(true);
    const [availLoading, setAvailLoading] = useState(false);
    const [groupSize, setGroupSize]     = useState(2);
    const [bookingPhase, setBookingPhase] = useState('details');
    const [name, setName]               = useState('');
    const [phone, setPhone]             = useState('');
    const [token, setToken]             = useState(null);
    const [photoIdx, setPhotoIdx]       = useState(0);
    const [isJoining, setIsJoining]     = useState(false);

    const user       = useAuthStore(state => state.user);
    const setMyToken = useQueueStore(state => state.setMyToken);
    const navigate   = useNavigate();

    /* ── fetch restaurant + tables ── */
    useEffect(() => {
        const fetchRest = async () => {
            try {
                const [restRes, tRes] = await Promise.all([
                    axios.get(`${API}/restaurants/${id}`),
                    axios.get(`${API}/tables/restaurant/${id}`),
                ]);
                setRestaurant(restRes.data);
                setTables(tRes.data);

                if (user) {
                    setName(user.name || '');
                    setPhone(user.phone || '');
                }

                const params = new URLSearchParams(window.location.search);
                if (params.get('fromQR')) {
                    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 500);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRest();
    }, [id, user]);

    /* ── check seat availability whenever groupSize or tables change ── */
    const checkAvailability = useCallback(async (size) => {
        if (!id) return;
        setAvailLoading(true);
        try {
            const res = await axios.get(`${API}/tables/restaurant/${id}/availability`, {
                params: { group_size: size }
            });
            setAvailability(res.data);
            // Keep local tables in sync too
            setTables(res.data.tables);
        } catch (err) {
            console.error('Availability check failed', err);
        } finally {
            setAvailLoading(false);
        }
    }, [id]);

    useEffect(() => {
        if (!loading) checkAvailability(groupSize);
    }, [groupSize, loading, checkAvailability]);

    /* ── group size controls ── */
    const decrement = () => setGroupSize(g => Math.max(1, g - 1));
    const increment = () => setGroupSize(g => Math.min(50, g + 1));

    /* ── join queue ── */
    const handleBooking = async (e) => {
        e.preventDefault();
        if (isJoining) return;
        setIsJoining(true);
        try {
            const res = await axios.post(`${API}/queue/join`, {
                restaurant_id: id,
                user_id: user?.user_id || null,
                customer_name: name,
                customer_phone: phone,
                group_size: groupSize,
            });
            setToken(res.data);
            setMyToken(res.data);
            setBookingPhase('success');
        } catch (err) {
            alert('Booking failed: ' + (err.response?.data?.detail || 'Unknown error'));
        } finally {
            setIsJoining(false);
        }
    };

    /* ── loading / not found ── */
    if (loading) return (
        <div className="section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div><div className="spinner" style={{ marginBottom: '1rem' }} /><p className="italic-serif" style={{ color: 'var(--primary-green)' }}>Loading restaurant...</p></div>
        </div>
    );

    if (!restaurant) return (
        <div className="section text-center">
            <h2 style={{ color: 'var(--red)' }}>Restaurant not found.</h2>
            <button onClick={() => navigate('/home')} className="btn btn-primary mt-8">Return Home</button>
        </div>
    );

    const emptyTables          = tables.filter(t => t.status === 'empty');
    const totalAvailableSeats  = emptyTables.reduce((s, t) => s + t.seats, 0);
    const allImages            = restaurant.images || [];
    const canSeatNow           = availability?.can_seat_now ?? false;
    const seatsMissing         = Math.max(0, groupSize - totalAvailableSeats);

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ background: 'var(--pure-white)', borderBottom: '1px solid var(--border-color)', padding: '0.8rem 0' }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        <ArrowLeft size={14} /> Back
                    </button>
                    <h1 className="logo" style={{ fontSize: '1.4rem' }}>NO2Q<span>+</span></h1>
                    <div style={{ width: '80px' }} />
                </div>
            </div>

            <div className="container section" style={{ paddingTop: '2rem' }}>
                {bookingPhase !== 'success' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>

                        {/* ═══ LEFT COLUMN ═══ */}
                        <div>
                            {/* Title */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-brown)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                                    <Utensils size={14} /> Premium Dining Spot
                                </div>
                                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', lineHeight: 1.05, marginBottom: '0.75rem' }}>{restaurant.name}</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.9rem', flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <MapPin size={16} style={{ color: 'var(--accent-brown)' }} /> {restaurant.location}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Star size={16} fill="#D97706" style={{ color: '#D97706' }} /> 4.8 Rating
                                    </span>
                                </div>
                            </div>

                            {/* Photo Gallery */}
                            {allImages.length > 0 && (
                                <div className="card" style={{ marginBottom: '2rem' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src={allImages[photoIdx]} alt="Restaurant" style={{ width: '100%', height: '340px', objectFit: 'cover' }} />
                                        {allImages.length > 1 && (
                                            <div style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.4rem' }}>
                                                {allImages.map((_, i) => (
                                                    <button key={i} onClick={() => setPhotoIdx(i)} style={{
                                                        width: i === photoIdx ? '24px' : '8px', height: '8px', borderRadius: '4px',
                                                        background: i === photoIdx ? 'white' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Live Stats */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                                <div className="stat-card">
                                    <div className="stat-label">Available Tables</div>
                                    <div className="stat-value" style={{ color: emptyTables.length > 0 ? 'var(--green)' : 'var(--red)' }}>{emptyTables.length}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Available Seats</div>
                                    <div className="stat-value" style={{ color: totalAvailableSeats > 0 ? 'var(--green)' : 'var(--red)' }}>{totalAvailableSeats}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">In Queue</div>
                                    <div className="stat-value">{restaurant.active_queue || 0}</div>
                                </div>
                            </div>

                            {/* ═══ TABLE MAP ═══ */}
                            <div className="card" style={{ marginBottom: '2rem' }}>
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Coffee size={18} /> Table Availability
                                    </h4>
                                    <button
                                        onClick={() => checkAvailability(groupSize)}
                                        disabled={availLoading}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-green)', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 700, fontSize: '0.8rem' }}
                                    >
                                        <RefreshCw size={14} style={{ animation: availLoading ? 'spin 1s linear infinite' : 'none' }} />
                                        Refresh
                                    </button>
                                </div>

                                <div style={{ padding: '1.5rem' }}>
                                    {/* Legend */}
                                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                        {Object.entries(TABLE_COLORS).map(([key, c]) => (
                                            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: c.border }} />
                                                {c.label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Table Grid */}
                                    {tables.length === 0 ? (
                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No tables configured yet.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.75rem' }}>
                                            {tables.map(t => <TableCard key={t._id} table={t} />)}
                                        </div>
                                    )}

                                    {/* Summary row */}
                                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                            Total tables: <b style={{ color: 'var(--text-dark)' }}>{tables.length}</b>
                                        </span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                            Free tables: <b style={{ color: '#10B981' }}>{emptyTables.length}</b>
                                        </span>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                            Free seats: <b style={{ color: '#10B981' }}>{totalAvailableSeats}</b>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Menu */}
                            {(restaurant.menu_images?.length > 0 || restaurant.menu_url) && (
                                <div className="card" style={{ marginBottom: '2rem' }}>
                                    <div className="p-6" style={{ borderBottom: '1px solid var(--border-light)' }}>
                                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                            <FileText size={18} /> Menu
                                        </h4>
                                    </div>
                                    <div className="p-6">
                                        {restaurant.menu_images?.length > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: restaurant.menu_url ? '1rem' : 0 }}>
                                                {restaurant.menu_images.map((img, i) => (
                                                    <img key={i} src={img} alt={`Menu ${i + 1}`} style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')} />
                                                ))}
                                            </div>
                                        )}
                                        {restaurant.menu_url && (
                                            <a href={restaurant.menu_url} target="_blank" rel="noreferrer" className="btn btn-outline" style={{ width: '100%' }}>
                                                <FileText size={16} /> View Full Menu PDF
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* About */}
                            <div className="card">
                                <div className="p-6">
                                    <h4 style={{ marginBottom: '0.5rem' }}>About this location</h4>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                                        Located at {restaurant.location}, {restaurant.name} offers an unparalleled dining experience.
                                        Use NO2Q+ to skip the physical line and get notified when your table is ready.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ═══ RIGHT COLUMN — Booking Form ═══ */}
                        <div>
                            <div className="card" style={{ position: 'sticky', top: '80px' }}>
                                <div style={{ background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--primary-green-dark) 100%)', padding: '1.75rem', color: 'white', textAlign: 'center' }}>
                                    <h3 style={{ color: 'inherit', marginBottom: '0.3rem' }} className="italic-serif">Reserve Your Spot</h3>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                        {emptyTables.length} table{emptyTables.length !== 1 ? 's' : ''} &nbsp;·&nbsp; {totalAvailableSeats} seat{totalAvailableSeats !== 1 ? 's' : ''} free
                                    </p>
                                </div>

                                <form onSubmit={handleBooking} style={{ padding: '1.5rem' }}>
                                    {/* Group Size */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
                                            Number of Guests
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F8F9FA', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <button type="button" onClick={decrement} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid var(--border-color)', fontSize: '1.1rem' }}>−</button>
                                            <div style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary-green)' }}>{groupSize}</div>
                                            <button type="button" onClick={increment} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid var(--border-color)', fontSize: '1.1rem' }}>+</button>
                                        </div>
                                    </div>

                                    {/* ── Seat Availability Banner ── */}
                                    {availLoading ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.85rem 1rem', background: '#F8F9FA', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                            <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                            Checking availability…
                                        </div>
                                    ) : availability ? (
                                        canSeatNow ? (
                                            <div style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                                padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem',
                                                background: '#ECFDF5', border: '1.5px solid #10B981',
                                            }}>
                                                <CheckCircle2 size={18} style={{ color: '#10B981', flexShrink: 0, marginTop: '1px' }} />
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#065F46', margin: 0 }}>
                                                        Seats available right now!
                                                    </p>
                                                    <p style={{ fontSize: '0.75rem', color: '#047857', margin: '0.2rem 0 0' }}>
                                                        {totalAvailableSeats} seat{totalAvailableSeats !== 1 ? 's' : ''} across {emptyTables.length} free table{emptyTables.length !== 1 ? 's' : ''} can accommodate your group of {groupSize}.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{
                                                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                                                padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem',
                                                background: '#FFF7ED', border: '1.5px solid #F59E0B',
                                            }}>
                                                <AlertCircle size={18} style={{ color: '#D97706', flexShrink: 0, marginTop: '1px' }} />
                                                <div>
                                                    <p style={{ fontWeight: 700, fontSize: '0.82rem', color: '#92400E', margin: 0 }}>
                                                        {totalAvailableSeats === 0
                                                            ? 'No seats available right now'
                                                            : `Only ${totalAvailableSeats} seat${totalAvailableSeats !== 1 ? 's' : ''} available — need ${groupSize}`}
                                                    </p>
                                                    <p style={{ fontSize: '0.75rem', color: '#B45309', margin: '0.2rem 0 0' }}>
                                                        You can still join the queue and you'll be seated as soon as a table frees up. Estimated wait: <b>~{availability.estimated_wait_mins} mins</b>.
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    ) : null}

                                    {/* Name */}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Full Name</label>
                                        <input required className="input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                                    </div>

                                    {/* Phone */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>Phone Number</label>
                                        <input required className="input" placeholder="10-digit number" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%' }} />
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={isJoining}
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '1.1rem', opacity: isJoining ? 0.7 : 1 }}
                                    >
                                        {isJoining ? 'Joining the Queue…' : canSeatNow ? '🎉 Join Queue — Seats Ready!' : '⏳ Join Queue — Wait for Table'}
                                    </button>

                                    {!canSeatNow && availability && (
                                        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
                                            You'll be notified via SMS when a table is free for your group.
                                        </p>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>

                ) : (
                    /* ─── Success State ─── */
                    <div className="card text-center fade-in" style={{ maxWidth: '550px', margin: '0 auto', padding: '3.5rem' }}>
                        <div style={{ width: '80px', height: '80px', background: 'var(--green-bg)', color: 'var(--green)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <CheckCircle2 size={44} />
                        </div>
                        <h1 style={{ marginBottom: '0.5rem' }} className="italic-serif">Queue Joined!</h1>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
                            Your estimated wait is <strong>{token.estimated_time_mins} mins</strong>
                        </p>

                        <div style={{ background: '#F7FAFC', border: '2px dashed var(--border-color)', padding: '2rem', borderRadius: '20px', marginBottom: '1.5rem' }}>
                            <p style={{ textTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '0.4rem', letterSpacing: '2px' }}>Your Token Number</p>
                            <h2 style={{ fontSize: '3.5rem', color: 'var(--primary-green)', margin: 0 }}>{token.token_number}</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div className="stat-card">
                                <div className="stat-label">Position</div>
                                <div className="stat-value">#{token.position}</div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-label">Est. Wait</div>
                                <div className="stat-value">{token.estimated_time_mins}m</div>
                            </div>
                        </div>

                        <button onClick={() => navigate(`/live-tracking/${token._id}`)} className="btn btn-primary" style={{ width: '100%', padding: '1.1rem' }}>
                            Track Status Live <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantDetails;
