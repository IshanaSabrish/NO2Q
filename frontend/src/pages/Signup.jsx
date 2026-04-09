import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/store";
import { User, Building2, Shield } from "lucide-react";

export default function Signup() {
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    restaurantName: "",
    restaurantLocation: "",
    gstNumber: "",
    fssaiNumber: "",
    fssaiDoc: null,
    gstDoc: null,
    menuFile: null,
    photos: [],
  });
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const isCustomer = role === "customer";
  const buttonText = isCustomer
    ? "Register as Customer"
    : role === "owner"
    ? "Register as Owner"
    : "Register as Admin";

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      if (name === "photos") {
        setForm((prev) => ({ ...prev, photos: Array.from(files) }));
      } else if (name === "fssaiDoc" || name === "gstDoc" || name === "menuFile") {
        setForm((prev) => ({ ...prev, [name]: files[0] }));
      }
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const uploadFile = async (file) => {
    const data = new FormData();
    data.append("file", file);
    const response = await axios.post("http://localhost:8000/api/upload/", data);
    return response.data.url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        role,
        name: form.name,
        phone: form.phone,
      };

      if (!form.name || !form.phone) {
        alert("Name and phone are required.");
        return;
      }

      if (!isCustomer) {
        payload.email = form.email;
        payload.password = form.password;
      }

      if (role === "owner") {
        if (!form.email || !form.password || !form.restaurantName || !form.restaurantLocation) {
          alert("Owner registration requires email, password, restaurant name, and location.");
          return;
        }
        const uploads = {};
        if (form.fssaiDoc) uploads.fssai = await uploadFile(form.fssaiDoc);
        if (form.gstDoc) uploads.gst = await uploadFile(form.gstDoc);
        if (form.menuFile) uploads.menu_url = await uploadFile(form.menuFile);
        if (form.photos.length) {
          uploads.images = await Promise.all(form.photos.map(uploadFile));
        }

        payload.restaurant_name = form.restaurantName;
        payload.restaurant_location = form.restaurantLocation;
        payload.gst_number = form.gstNumber;
        payload.fssai_number = form.fssaiNumber;
        Object.assign(payload, uploads);
      }

      const response = await axios.post("http://localhost:8000/api/auth/register", payload);

      if (role === "customer" && response.data.token) {
        login(
          {
            name: response.data.name || form.name,
            role: "customer",
            status: response.data.status,
            user_id: response.data.user_id,
          },
          response.data.token
        );
        navigate("/home");
        return;
      }

      alert("Registration successful. Please sign in.");
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.message || err.message;
      alert(`Registration failed: ${message}`);
    }
  };

  return (
    <div className="auth-layout">
      <div className="card auth-card">
        <div className="logo-container" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '2.5rem', color: '#2c5f5f', fontWeight: 'bold', margin: '0' }}>NO2Q+</h1>
        </div>

        <div className="auth-header text-center" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ color: '#5a7a7a', fontSize: '1.1rem', margin: '0 0 0.5rem 0', fontWeight: 500 }}>Create an account to join the network.</h2>
        </div>

        <div className="role-select-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          <div
            className="role-card"
            onClick={() => setRole("customer")}
            style={{
              padding: '1.25rem',
              border: isCustomer ? '2px solid #2c5f5f' : '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: isCustomer ? '#f0f8f8' : '#fff',
            }}
          >
            <User size={28} style={{ color: '#2c5f5f', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#2c5f5f' }}>Customer</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>JOIN DIGITAL QUEUES</p>
          </div>

          <div
            className="role-card"
            onClick={() => setRole("owner")}
            style={{
              padding: '1.25rem',
              border: role === "owner" ? '2px solid #2c5f5f' : '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: role === "owner" ? '#f0f8f8' : '#fff',
            }}
          >
            <Building2 size={28} style={{ color: '#2c5f5f', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#2c5f5f' }}>Restaurant</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>MANAGE YOUR TABLES</p>
          </div>

          <div
            className="role-card"
            onClick={() => setRole("admin")}
            style={{
              padding: '1.25rem',
              border: role === "admin" ? '2px solid #2c5f5f' : '1px solid #e0e0e0',
              borderRadius: '0.75rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              backgroundColor: role === "admin" ? '#f0f8f8' : '#fff',
            }}
          >
            <Shield size={28} style={{ color: '#2c5f5f', marginBottom: '0.5rem' }} />
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.95rem', fontWeight: 600, color: '#2c5f5f' }}>Administrator</p>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#888' }}>SYSTEM OVERSIGHT</p>
          </div>
        </div>

        <form className="signup-form" onSubmit={handleSubmit} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>FULL NAME</label>
            <input
              className="input"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
              style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>PHONE NUMBER</label>
            <input
              className="input"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              placeholder="7777777777"
              style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
            />
          </div>

          {!isCustomer && (
            <>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>EMAIL ADDRESS</label>
                <input
                  className="input"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="owner@restaurant.com"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>PASSWORD</label>
                <input
                  className="input"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Create a secure password"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
                />
              </div>
            </>
          )}

          {role === "owner" ? (
            <div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>RESTAURANT NAME</label>
                <input
                  className="input"
                  name="restaurantName"
                  value={form.restaurantName}
                  onChange={handleChange}
                  required
                  placeholder="Example: Spice Junction"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>LOCATION</label>
                <input
                  className="input"
                  name="restaurantLocation"
                  value={form.restaurantLocation}
                  onChange={handleChange}
                  required
                  placeholder="Area, city or street"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>GST NUMBER</label>
                <input
                  className="input"
                  name="gstNumber"
                  value={form.gstNumber}
                  onChange={handleChange}
                  placeholder="GSTIN"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>FSSAI NUMBER</label>
                <input
                  className="input"
                  name="fssaiNumber"
                  value={form.fssaiNumber}
                  onChange={handleChange}
                  placeholder="FSSAI License"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '1rem', width: '100%' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>FSSAI DOCUMENT</label>
                <input
                  className="input"
                  name="fssaiDoc"
                  type="file"
                  onChange={handleChange}
                  accept="image/*,.pdf"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>GST DOCUMENT</label>
                <input
                  className="input"
                  name="gstDoc"
                  type="file"
                  onChange={handleChange}
                  accept="image/*,.pdf"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>RESTAURANT PHOTOS</label>
                <input
                  className="input"
                  name="photos"
                  type="file"
                  onChange={handleChange}
                  accept="image/*"
                  multiple
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem' }}
                />
              </div>
              <div className="input-group" style={{ marginBottom: '1rem' }}>
                <label className="input-label" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#5a7a7a', marginBottom: '0.5rem' }}>MENU PDF</label>
                <input
                  className="input"
                  name="menuFile"
                  type="file"
                  onChange={handleChange}
                  accept="application/pdf"
                  style={{ padding: '0.75rem 1rem', border: '1px solid #ddd', borderRadius: '0.5rem', fontSize: '0.95rem' }}
                />
              </div>
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary btn-full" style={{ padding: '1rem', fontSize: '1rem', fontWeight: 600, borderRadius: '0.5rem', backgroundColor: '#2c5f5f', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.3s', marginTop: '1rem' }}>
            {buttonText}
          </button>
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#666', fontSize: '0.95rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#2c5f5f', fontWeight: 700, textDecoration: 'none' }}>
              Sign in instead
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
