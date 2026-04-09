import { useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/store';
import { useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Plus, Play, ArrowRight, Utensils } from 'lucide-react';

const InitialSetup = () => {
  const [tables, setTables] = useState([]);
  const [seats, setSeats] = useState(2);
  const [qty, setQty] = useState(1);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const handleAddTableType = () => {
    setTables([...tables, { seats, qty }]);
  };

  const handleComplete = async () => {
    try {
      await axios.post('http://localhost:8000/api/restaurants/setup', {
        owner_id: user.user_id,
        table_config: tables
      });
      alert('Restaurant setup complete!');
      navigate('/owner-dashboard');
    } catch (e) {
      alert('Setup failed: ' + (e.response?.data?.detail || 'Unknown error'));
    }
  };

  return (
    <div className="auth-layout" style={{ background: 'var(--cream-white)' }}>
      <div className="card" style={{ maxWidth: '600px', width: '100%', padding: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary-green)', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <LayoutDashboard size={32} />
          </div>
          <h2 className="italic-serif" style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Initial Table Setup</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Define your restaurant's capacity to start accepting bookings.</p>
        </div>

        <div style={{ background: '#F8F9FA', borderRadius: '20px', padding: '1.5rem', marginBottom: '2rem' }}>
          <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Seats per Table</label>
              <input type="number" min="1" className="input" value={seats} onChange={e => setSeats(Number(e.target.value))} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label">Quantity</label>
              <input type="number" min="1" className="input" value={qty} onChange={e => setQty(Number(e.target.value))} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleAddTableType}>
            <Plus size={18} /> Add Table Batch
          </button>
        </div>

        <div style={{ marginBottom: '2.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Configuration</h4>
          {tables.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: '#F8F9FA', borderRadius: '16px', border: '2px dashed var(--border-color)', color: 'var(--text-light)', fontSize: '0.9rem' }}>
              No tables added yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tables.map((t, idx) => (
                <div key={idx} style={{ padding: '1rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary-green-light)', color: 'white', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{t.qty}</div>
                    <span style={{ fontWeight: 600 }}>Tables</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t.seats} SEATS EACH</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1.1rem', fontSize: '1rem' }} 
          disabled={tables.length === 0}
          onClick={handleComplete}
        >
          Activate Dashboard <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
        </button>
      </div>
    </div>
  );
};

export default InitialSetup;
