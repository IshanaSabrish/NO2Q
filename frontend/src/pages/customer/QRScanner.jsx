import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Camera } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8000/api';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      qrbox: { width: 250, height: 250 },
      fps: 5,
    });

    scanner.render(async (decodedText) => {
      scanner.clear();
      setScanResult(decodedText);
      
      // Check if it's a NO2Q QR code
      if (decodedText.startsWith('no2q-')) {
        try {
          const res = await axios.get(`${API}/restaurants/qr/${decodedText}`);
          navigate(`/restaurant/${res.data._id}?fromQR=true`);
        } catch (err) {
          setError('Restaurant not found for this QR code');
        }
      } else if (decodedText.match(/^[a-f0-9]{24}$/)) {
        // Direct restaurant ID
        navigate(`/restaurant/${decodedText}`);
      } else {
        setError('Invalid QR code format');
      }
    }, (err) => {
      // Scanning in progress
    });

    scannerRef.current = scanner;

    return () => {
      try { scanner.clear(); } catch (e) {}
    };
  }, [navigate]);

  return (
    <div className="fade-in" style={{ minHeight: '100vh', background: 'var(--cream-white)' }}>
      <nav className="nav">
        <div className="container nav-content">
          <button onClick={() => navigate('/home')} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            <ArrowLeft size={14} /> Back
          </button>
          <h1 className="logo" style={{ fontSize: '1.4rem' }}>Scan QR</h1>
          <div style={{ width: '80px' }}></div>
        </div>
      </nav>

      <div className="container" style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--primary-green)', color: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <QrCode size={32} />
          </div>
          <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Scan Restaurant QR</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2rem' }}>
            Point your camera at the QR code on the table or entrance.
          </p>
          
          <div id="reader" style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '1.5rem' }}></div>
          
          {scanResult && !error && (
            <div style={{ padding: '1rem', background: 'var(--green-bg)', borderRadius: '12px', color: 'var(--green)', fontWeight: 700 }}>
              ✓ QR Found: {scanResult}
            </div>
          )}
          
          {error && (
            <div style={{ padding: '1rem', background: 'var(--red-bg)', borderRadius: '12px', color: 'var(--red)', fontWeight: 700, marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          
          <button className="btn btn-outline" onClick={() => navigate('/home')} style={{ width: '100%', marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to Restaurants
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
