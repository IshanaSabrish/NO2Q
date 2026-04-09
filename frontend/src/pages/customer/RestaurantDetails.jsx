import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore, useQueueStore } from '../../store/store';
import { MapPin, Clock, Users, ArrowLeft, ChevronRight, CheckCircle2, Star, Utensils, ImageIcon, FileText, Phone } from 'lucide-react';

const API = 'http://localhost:8000/api';

const RestaurantDetails = () => {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [groupSize, setGroupSize] = useState(2);
    const [bookingPhase, setBookingPhase] = useState('details'); // details, booking, success
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [token, setToken] = useState(null);
    const [menuView, setMenuView] = useState(false);
    const [photoIdx, setPhotoIdx] = useState(0);
    const user = useAuthStore(state => state.user);
    const setMyToken = useQueueStore(state => state.setMyToken);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRest = async () => {
            try {
                const res = await axios.get(`${API}/restaurants/${id}`);
                setRestaurant(res.data);
                const tRes = await axios.get(`${API}/tables/restaurant/${id}`);
                setTables(tRes.data);
                
                // Auto-fill and auto-open booking if from QR
                if (user) {
                    setName(user.name || '');
                    setPhone(user.phone || '');
                }
                
                const params = new URLSearchParams(window.location.search);
                if (params.get('fromQR')) {
                    // Give a small delay for better visual transition
                    setTimeout(() => {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }, 500);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRest();
    }, [id, user]);


    const [isJoining, setIsJoining] = useState(false);

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
                group_size: groupSize
            });
            setToken(res.data);
            setMyToken(res.data);
            setBookingPhase('success');
        } catch (err) {
            alert("Booking failed: " + (err.response?.data?.detail || "Unknown error"));
        } finally {
            setIsJoining(false);
        }
    };

    if (loading) return (
        <div className="section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div><div className="spinner" style={{ marginBottom: '1rem' }}></div><p className="italic-serif" style={{ color: 'var(--primary-green)' }}>Loading restaurant...</p></div>
        </div>
    );
    
    if (!restaurant) return (
        <div className="section text-center">
            <h2 style={{ color: 'var(--red)' }}>Restaurant not found.</h2>
            <button onClick={() => navigate('/home')} className="btn btn-primary mt-8">Return Home</button>
        </div>
    );

    const emptyTables = tables.filter(t => t.status === 'empty').length;
    const allImages = restaurant.images || [];

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ background: 'var(--pure-white)', borderBottom: '1px solid var(--border-color)', padding: '0.8rem 0' }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        <ArrowLeft size={14} /> Back
                    </button>
                    <h1 className="logo" style={{ fontSize: '1.4rem' }}>NO2Q<span>+</span></h1>
                    <div style={{ width: '80px' }}></div>
                </div>
            </div>

            <div className="container section" style={{ paddingTop: '2rem' }}>
                {bookingPhase !== 'success' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
                        {/* Left: Info */}
                        <div>
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
                                        <img 
                                            src={allImages[photoIdx]} 
                                            alt="Restaurant"
                                            style={{ width: '100%', height: '340px', objectFit: 'cover' }}
                                        />
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
                                    <div className="stat-value" style={{ color: emptyTables > 0 ? 'var(--green)' : 'var(--red)' }}>{emptyTables}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">In Queue</div>
                                    <div className="stat-value">{restaurant.active_queue || 0}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Est. Wait</div>
                                    <div className="stat-value">{Math.max(0, (restaurant.active_queue || 0) - emptyTables) * 15}m</div>
                                </div>
                            </div>

                            {/* Menu Section */}
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
                                                    <img key={i} src={img} alt={`Menu ${i+1}`} style={{ width: '100%', borderRadius: '8px', cursor: 'pointer' }} onClick={() => window.open(img, '_blank')} />
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

                        {/* Right: Booking Form */}
                        <div>
                            <div className="card" style={{ position: 'sticky', top: '80px' }}>
                                <div style={{ background: 'linear-gradient(135deg, var(--primary-green) 0%, var(--primary-green-dark) 100%)', padding: '1.75rem', color: 'white', textAlign: 'center' }}>
                                    <h3 style={{ color: 'inherit', marginBottom: '0.3rem' }} className="italic-serif">Reserve Your Spot</h3>
                                    <p style={{ fontSize: '0.85rem', opacity: 0.8 }}>Current wait: <span style={{ fontWeight: 800 }}>{Math.max(0, (restaurant.active_queue || 0) - emptyTables) * 15} mins</span></p>
                                </div>
                                <form onSubmit={handleBooking} className="p-6">
                                    {/* Group Size */}
                                    <div className="input-group">
                                        <label className="input-label">Number of Guests</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F8F9FA', padding: '0.4rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                            <button type="button" onClick={() => setGroupSize(Math.max(1, groupSize - 1))} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid var(--border-color)', fontSize: '1.1rem' }}>−</button>
                                            <div style={{ flex: 1, textAlign: 'center', fontWeight: 900, fontSize: '1.3rem', color: 'var(--primary-green)' }}>{groupSize}</div>
                                            <button type="button" onClick={() => setGroupSize(Math.min(20, groupSize + 1))} className="btn" style={{ padding: '0.4rem 0.8rem', background: 'white', border: '1px solid var(--border-color)', fontSize: '1.1rem' }}>+</button>
                                        </div>
                                    </div>

                                    {/* Name */}
                                    <div className="input-group">
                                        <label className="input-label">Full Name</label>
                                        <input required className="input" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Phone Number</label>
                                        <input 
                                            required 
                                            className="input" 
                                            placeholder="10-digit number" 
                                            value={phone} 
                                            onChange={(e) => setPhone(e.target.value)}
                                            style={{ width: '100%' }}
                                        />
                                    </div>

                                    <button 
                                        type="submit" 
                                        disabled={isJoining}
                                        className="btn btn-primary" 
                                        style={{ 
                                            width: '100%', padding: '1.1rem', marginTop: '0.5rem',
                                            opacity: isJoining ? 0.7 : 1
                                        }}
                                    >
                                        {isJoining ? 'Joining the Queue...' : 'Join the Live Queue'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Success State */
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

                        <button 
                            onClick={() => navigate(`/live-tracking/${token._id}`)} 
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '1.1rem' }}
                        >
                            Track Status Live <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RestaurantDetails;
