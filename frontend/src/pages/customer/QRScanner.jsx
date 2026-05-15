import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, Camera, ImagePlus } from 'lucide-react';
import axios from 'axios';

const API = 'http://localhost:8000/api';

const QRScanner = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  const processResult = async (decodedText) => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(e=>console.log(e));
      scannerRef.current.clear();
    }
    setScanResult(decodedText);
    
    if (decodedText.startsWith('no2q-')) {
      try {
        const res = await axios.get(`${API}/restaurants/qr/${decodedText}`);
        navigate(`/restaurant/${res.data._id}?fromQR=true`);
      } catch (err) {
        setError('Restaurant not found for this QR code');
      }
    } else if (decodedText.includes('/restaurant/')) {
      try {
          const url = new URL(decodedText);
          navigate(url.pathname + url.search);
      } catch (e) {
          const pathParts = decodedText.split('/restaurant/');
          if (pathParts.length > 1) {
              navigate(`/restaurant/${pathParts[1]}`);
          } else {
              setError('Invalid QR code URL');
          }
      }
    } else if (decodedText.match(/^[a-f0-9]{24}$/)) {
      navigate(`/restaurant/${decodedText}`);
    } else {
      setError('Invalid QR code format');
    }
  };

  useEffect(() => {
    let mounted = true;
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text) => { if(mounted) processResult(text); },
      () => {}
    ).then(() => {
      if (!mounted) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
      }
    }).catch(err => {
      if(mounted) setError("Camera access denied or unavailable.");
    });

    return () => {
      mounted = false;
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => html5QrCode.clear()).catch(() => {});
      }
    };
  }, [navigate]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current.clear();
    }
    
    try {
      const tempQr = new Html5Qrcode("reader");
      const decodedText = await tempQr.scanFile(file, true);
      processResult(decodedText);
    } catch (err) {
      setError("Could not detect a valid QR code in this image.");
    }
  };

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
          
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => navigate('/home')} style={{ flex: 1 }}>
              <ArrowLeft size={16} /> Back
            </button>
            <label className="btn btn-primary" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ImagePlus size={16} /> Upload Image
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
