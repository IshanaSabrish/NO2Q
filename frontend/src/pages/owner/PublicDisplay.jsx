import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '../../store/store';
import axios from 'axios';
import { Clock, Users, Utensils, Monitor } from 'lucide-react';

const API = 'http://localhost:8000/api';

const PublicDisplay = () => {
  const user = useAuthStore(state => state.user);
  const [serving, setServing] = useState({ current: null, next: [] });
  const [tables, setTables] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const wsRef = useRef(null);

  const fetchData = async (rid) => {
    try {
      const [sRes, tRes] = await Promise.all([
        axios.get(`${API}/queue/restaurant/${rid}/serving`),
        axios.get(`${API}/tables/restaurant/${rid}`)
      ]);
      setServing(sRes.data);
      setTables(tRes.data);
    } catch (e) {}
  };

  useEffect(() => {
    const init = async () => {
      try {
        const res = await axios.get(`${API}/restaurants/by-owner/${user.user_id}`);
        setRestaurant(res.data);
        const rid = res.data._id;
        
        fetchData(rid);
        
        // WebSocket
        try {
          const ws = new WebSocket(`ws://localhost:8000/api/queue/ws/${rid}`);
          wsRef.current = ws;
          ws.onmessage = () => fetchData(rid);
        } catch (e) {}
        
        // Polling as fallback
        const interval = setInterval(() => fetchData(rid), 5000);
        return () => clearInterval(interval);
      } catch (e) {}
    };
    if (user) init();
  }, [user]);

  if (!restaurant) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A1628' }}>
      <div className="spinner"></div>
    </div>
  );

  const emptyTables = tables.filter(t => t.status === 'empty').length;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0A1628 0%, #1A2A44 50%, #0A1628 100%)', 
      color: 'white', 
      padding: '2.5rem',
      fontFamily: "'Outfit', sans-serif"
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Monitor size={24} style={{ opacity: 0.5 }} />
          <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '3px', opacity: 0.5 }}>Live Queue Display</span>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'white', margin: 0 }}>{restaurant.name}</h1>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Left: Tokens */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Now Serving */}
          <div style={{ 
            background: 'linear-gradient(135deg, #38A169 0%, #2F855A 100%)', 
            borderRadius: '24px', 
            padding: '3rem', 
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(56, 161, 105, 0.3)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700, opacity: 0.8, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '3px' }}>Now Serving</p>
            <div style={{ fontSize: '6rem', fontWeight: 900, lineHeight: 1 }}>
              {serving.current && serving.current.length > 0 ? serving.current[0].token_number : '---'}
            </div>
            {serving.current && serving.current.length > 0 && (
              <p style={{ marginTop: '1rem', fontSize: '1.1rem', opacity: 0.8, fontWeight: 600 }}>
                {serving.current[0].customer_name} • {serving.current[0].group_size} guests
              </p>
            )}
            {serving.current && serving.current.length > 1 && (
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                {serving.current.slice(1, 4).map(t => (
                  <div key={t._id} style={{ opacity: 0.6 }}>
                    <span style={{ fontWeight: 800 }}>{t.token_number}</span>
                    <span style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>{t.customer_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Up Next */}
          <div style={{ 
            background: 'rgba(255,255,255,0.05)', 
            borderRadius: '20px', 
            padding: '2rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem' }}>Up Next</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
              {serving.next.length === 0 ? (
                <p style={{ opacity: 0.3, gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>No one in queue</p>
              ) : serving.next.map(t => (
                <div key={t._id} style={{ 
                  background: 'rgba(255,255,255,0.08)', 
                  borderRadius: '16px', 
                  padding: '1.5rem', 
                  textAlign: 'center',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 900 }}>{t.token_number}</div>
                  <p style={{ fontSize: '0.75rem', opacity: 0.5, marginTop: '0.3rem' }}>{t.group_size}p</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Tables */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '20px', 
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', margin: 0 }}>Tables</h3>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#68D391' }}>{emptyTables} free</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {tables.map(t => {
              const statusColors = {
                empty: { bg: 'rgba(56, 161, 105, 0.15)', border: '#38A169', dot: '#38A169' },
                full: { bg: 'rgba(229, 62, 62, 0.15)', border: '#E53E3E', dot: '#E53E3E' },
                cleaning: { bg: 'rgba(217, 119, 6, 0.15)', border: '#D97706', dot: '#D97706' }
              };
              const c = statusColors[t.status] || statusColors.empty;
              
              return (
                <div key={t._id} style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  background: c.bg,
                  borderLeft: `4px solid ${c.border}`,
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 900, fontSize: '1.1rem' }}>T{t.number}</div>
                  <div style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', marginTop: '0.2rem' }}>{t.seats}s • {t.status}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '3rem', opacity: 0.2, fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '4px' }}>
        NO2Q+ Smart Queue System • Auto-updating
      </div>
    </div>
  );
};

export default PublicDisplay;
