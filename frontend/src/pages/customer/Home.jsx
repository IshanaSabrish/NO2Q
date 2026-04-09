import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/store';
import { LogOut, MapPin, Search, QrCode, Clock, Star, ChevronRight, Users, Utensils } from 'lucide-react';

const API = 'http://localhost:8000/api';

const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await axios.get(`${API}/restaurants/`);
        setRestaurants(res.data);
      } catch (err) {
        console.error("Failed to fetch restaurants");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter(r => r.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="fade-in">
      {/* Navigation */}
      <nav className="nav">
        <div className="container nav-content">
          <Link to="/" className="logo">NO2Q<span>+</span></Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button onClick={() => navigate('/scan')} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <QrCode size={16} /> Scan QR
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', borderLeft: '1px solid var(--border-color)', paddingLeft: '1rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-green)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                {(user?.name || user?._name || 'U')[0].toUpperCase()}
              </div>
              <button 
                onClick={() => { logout(); navigate('/login'); }} 
                className="btn btn-icon btn-danger"
                style={{ padding: '0.4rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Search */}
      <section className="section" style={{ 
        background: `linear-gradient(135deg, rgba(46, 79, 79, 0.03) 0%, rgba(253, 252, 248, 1) 50%, rgba(139, 69, 19, 0.03) 100%)`,
        paddingBottom: '2rem'
      }}>
        <div className="container text-center">
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, marginBottom: '1rem' }}>
            Stop <span className="italic-serif" style={{ color: 'var(--accent-brown)' }}>Waiting</span>. <br />
            Start <span className="italic-serif" style={{ color: 'var(--accent-brown)' }}>Dining</span>.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 2.5rem', fontWeight: 500 }}>
            Join live restaurant queues from your phone and get notified when your table is ready.
          </p>
          
          <div className="card" style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', padding: '0.4rem', boxShadow: 'var(--shadow)' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 1.2rem' }}>
              <Search size={18} style={{ color: 'var(--text-light)', marginRight: '0.8rem', flexShrink: 0 }} />
              <input 
                type="text" 
                placeholder="Search restaurants..."
                className="input"
                style={{ border: 'none', padding: '0.9rem 0', boxShadow: 'none' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>Search</button>
          </div>
        </div>
      </section>

      {/* Restaurant Listings */}
      <div className="container" style={{ paddingBottom: '4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>Nearby Restaurants</h3>
            <p className="italic-serif" style={{ color: 'var(--accent-brown)', fontSize: '0.95rem' }}>Handpicked spots for you</p>
          </div>
          <p style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filtered.length} found</p>
        </div>

        {loading ? (
          <div className="text-center p-8"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Search size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <h4>No restaurants found</h4>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-3">
            {filtered.map((rest, i) => (
              <Link to={`/restaurant/${rest._id}`} key={rest._id} className="card card-hover" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                  <img 
                    src={rest.images?.[0] || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80"} 
                    alt={rest.name} 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                  />
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.92)', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary-green)', backdropFilter: 'blur(8px)' }}>
                    <MapPin size={12} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: '-2px' }} />
                    {rest.location?.split(',')[0]}
                  </div>
                  {rest.active_queue > 0 && (
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', background: 'rgba(46,79,79,0.9)', padding: '0.35rem 0.75rem', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 800, color: 'white' }}>
                      <Users size={11} style={{ display: 'inline', marginRight: '0.3rem', verticalAlign: '-1px' }} />
                      {rest.active_queue} in queue
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h4 style={{ fontSize: '1.2rem', margin: 0 }}>{rest.name}</h4>
                    <div className="badge badge-yellow" style={{ flexShrink: 0 }}>
                      <Star size={11} fill="currentColor" style={{ marginRight: '0.2rem' }} /> 4.8
                    </div>
                  </div>
                  
                  <p style={{ display: 'flex', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <MapPin size={14} style={{ marginRight: '0.4rem', color: 'var(--accent-brown)', flexShrink: 0 }} /> {rest.location}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-green)', fontSize: '0.75rem', fontWeight: 700 }}>
                        <Clock size={13} /> ~{rest.active_queue > 0 ? rest.active_queue * 15 : 5}m wait
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--green)', fontSize: '0.75rem', fontWeight: 700 }}>
                        <Utensils size={13} /> {rest.empty_tables || 0}/{rest.total_tables || 0} tables
                      </div>
                    </div>
                    <div className="btn btn-primary btn-icon" style={{ padding: '0.45rem', borderRadius: '10px' }}>
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <footer style={{ background: 'var(--pure-white)', borderTop: '1px solid var(--border-color)', padding: '2.5rem 0' }}>
        <div className="container text-center">
          <h1 className="logo" style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>NO2Q<span>+</span></h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Smart Restaurant Queue Management</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
