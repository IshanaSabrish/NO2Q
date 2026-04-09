import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const OwnerSignup = () => {
  const [formData, setFormData] = useState({
    ownerName: '',
    restaurantName: '',
    email: '',
    phone: '',
    password: '',
    location: '',
  });
  
  const [fssaiFile, setFssaiFile] = useState(null);
  const [gstFile, setGstFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [menuFile, setMenuFile] = useState(null);

  const navigate = useNavigate();

  const handleUpload = async (file) => {
    if (!file) return "";
    const fmData = new FormData();
    fmData.append("file", file);
    try {
      const res = await axios.post('http://localhost:8000/api/upload/', fmData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.url;
    } catch (e) {
      console.error(e);
      return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Upload files sequentially
    const fssaiUrl = await handleUpload(fssaiFile);
    const gstUrl = await handleUpload(gstFile);
    const photoUrl = await handleUpload(photoFile);
    const menuUrl = await handleUpload(menuFile);

    // Create User
    try {
      const userRes = await axios.post('http://localhost:8000/api/auth/register', {
        name: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role: "owner"
      });
      
      // Create Restaurant
      await axios.post('http://localhost:8000/api/restaurants/register', {
        owner_id: userRes.data.user._id,
        name: formData.restaurantName,
        location: formData.location,
        fssai: fssaiUrl,
        gst: gstUrl,
        images: photoUrl ? [photoUrl] : [],
        menu_url: menuUrl
      });

      alert("Registration successful! Please wait for Admin approval.");
      navigate('/login');
    } catch (err) {
      alert("Registration failed");
    }
  };

  return (
    <div className="card max-w-2xl mx-auto my-8">
      <h2 className="text-2xl font-bold text-primary mb-6 text-center">Restaurant Owner Signup</h2>
      <form onSubmit={handleSubmit} className="flex-col gap-4">
        <div className="grid md:-grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">Owner Name</label>
            <input required type="text" className="input-field" onChange={e => setFormData({...formData, ownerName: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="input-label">Restaurant Name</label>
            <input required type="text" className="input-field" onChange={e => setFormData({...formData, restaurantName: e.target.value})} />
          </div>
        </div>

        <div className="grid md:-grid-cols-2 gap-4">
           <div className="input-group">
            <label className="input-label">Phone & Email</label>
            <input required type="text" placeholder="Phone" className="input-field mb-2" onChange={e => setFormData({...formData, phone: e.target.value})} />
            <input required type="email" placeholder="Email" className="input-field" onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>
          <div className="input-group">
            <label className="input-label">Address / Location</label>
            <textarea required className="input-field h-full" onChange={e => setFormData({...formData, location: e.target.value})}></textarea>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Password</label>
          <input required type="password" className="input-field" onChange={e => setFormData({...formData, password: e.target.value})} />
        </div>

        <h3 className="font-semibold text-lg mt-4 mb-2 border-b pb-2">Documents & Images</h3>
        <div className="grid md:-grid-cols-2 gap-4">
          <div className="input-group">
            <label className="input-label">FSSAI Document</label>
            <input required type="file" className="input-field" onChange={e => setFssaiFile(e.target.files[0])} />
          </div>
          <div className="input-group">
            <label className="input-label">GST Document</label>
            <input required type="file" className="input-field" onChange={e => setGstFile(e.target.files[0])} />
          </div>
          <div className="input-group">
            <label className="input-label">Restaurant Photo</label>
            <input required type="file" className="input-field" onChange={e => setPhotoFile(e.target.files[0])} />
          </div>
          <div className="input-group">
            <label className="input-label">Menu Image/PDF</label>
            <input required type="file" className="input-field" onChange={e => setMenuFile(e.target.files[0])} />
          </div>
        </div>

        <button type="submit" className="btn btn-primary w-full mt-6">Submit Registration</button>
      </form>
    </div>
  );
};

export default OwnerSignup;
