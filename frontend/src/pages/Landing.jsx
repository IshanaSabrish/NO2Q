import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { ArrowRight, User, Building2, Shield, Sparkles } from 'lucide-react';

const Landing = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="auth-layout" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f8f8 0%, #ffffff 100%)'
    }}>
      <div className="card" style={{ 
        maxWidth: '500px', 
        width: '90%', 
        textAlign: 'center', 
        padding: '3rem 2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        borderRadius: '1.5rem'
      }}>
        <div className="logo-container" style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '3.5rem', 
            color: '#2c5f5f', 
            fontWeight: 800, 
            margin: '0',
            letterSpacing: '-2px'
          }}>NO2Q<span style={{ color: '#8b4513' }}>+</span></h1>
          <p style={{ color: '#5a7a7a', fontSize: '1.1rem', fontWeight: 500, marginTop: '0.5rem' }}>
            Smart Queue Management for Everyone
          </p>
        </div>

        <div style={{ marginBottom: '3rem' }}>
          <p style={{ color: '#666', fontSize: '1rem', lineHeight: 1.6 }}>
            Join the digital queue movement. Cut the physical waiting and enjoy your time while we hold your spot.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <Link to="/login" className="btn btn-primary" style={{ 
            padding: '1.25rem', 
            fontSize: '1.1rem', 
            fontWeight: 700,
            borderRadius: '1rem',
            backgroundColor: '#2c5f5f',
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            Sign in to Your Account <ArrowRight size={20} />
          </Link>
          
          <Link to="/signup" style={{ 
            padding: '1.25rem', 
            fontSize: '1.1rem', 
            fontWeight: 700,
            borderRadius: '1rem',
            color: '#2c5f5f',
            backgroundColor: '#fff',
            border: '2px solid #2c5f5f',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            Create New Account <Sparkles size={20} />
          </Link>
        </div>

        <div style={{ marginTop: '3rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <User size={20} style={{ color: '#5a7a7a', marginBottom: '0.25rem' }} />
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', margin: 0 }}>CUSTOMER</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Building2 size={20} style={{ color: '#5a7a7a', marginBottom: '0.25rem' }} />
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', margin: 0 }}>OWNER</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <Shield size={20} style={{ color: '#5a7a7a', marginBottom: '0.25rem' }} />
              <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#888', margin: 0 }}>ADMIN</p>
            </div>
          </div>
        </div>
      </div>
      
      {user && (
        <Link to={user.role === 'admin' ? '/admin-dashboard' : user.role === 'owner' ? '/owner-dashboard' : '/home'} 
          style={{ marginTop: '2rem', color: '#5a7a7a', fontWeight: 600, textDecoration: 'underline' }}>
          Back to your {user.role} dashboard
        </Link>
      )}
    </div>
  );
};

export default Landing;
