const DynamicSignupForm = ({ role, formData, onInputChange, onFileChange }) => {
  const commonFields = (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="input-group">
        <label className="input-label">Full Name</label>
        <input name="name" required type="text" className="input-field" value={formData.name} onChange={onInputChange} />
      </div>
      <div className="input-group">
        <label className="input-label">Phone Number</label>
        <input name="phone" required type="text" className="input-field" value={formData.phone} onChange={onInputChange} />
      </div>
    </div>
  );

  const authFields = (
    <div className="grid md:grid-cols-2 gap-6 mt-4">
      <div className="input-group">
        <label className="input-label">Email Address</label>
        <input name="email" required type="email" className="input-field" value={formData.email} onChange={onInputChange} />
      </div>
      <div className="input-group">
        <label className="input-label">Password</label>
        <input name="password" required type="password" className="input-field" value={formData.password} onChange={onInputChange} />
      </div>
    </div>
  );

  const restaurantFields = (
    <>
      <h3 className="text-lg font-bold border-b pb-2 mt-8 text-brown">Restaurant Details</h3>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div className="input-group">
          <label className="input-label">Restaurant Name</label>
          <input name="restaurantName" required type="text" className="input-field" value={formData.restaurantName} onChange={onInputChange} />
        </div>
        <div className="input-group">
          <label className="input-label">Location Address</label>
          <input name="location" required type="text" className="input-field" value={formData.location} onChange={onInputChange} />
        </div>
        <div className="input-group">
          <label className="input-label">FSSAI Number</label>
          <input name="fssaiNumber" required type="text" className="input-field" value={formData.fssaiNumber} onChange={onInputChange} />
        </div>
        <div className="input-group">
          <label className="input-label">GST Number</label>
          <input name="gstNumber" required type="text" className="input-field" value={formData.gstNumber} onChange={onInputChange} />
        </div>
      </div>

      <h3 className="text-lg font-bold border-b pb-2 mt-8 text-brown">Documents (Uploads)</h3>
      <div className="grid md:grid-cols-2 gap-6 mt-4">
        <div className="input-group">
          <label className="input-label">FSSAI Document</label>
          <input required type="file" className="input-field" onChange={(e) => onFileChange('fssai', e.target.files[0])} />
        </div>
        <div className="input-group">
          <label className="input-label">GST Certificate</label>
          <input required type="file" className="input-field" onChange={(e) => onFileChange('gst', e.target.files[0])} />
        </div>
        <div className="input-group">
          <label className="input-label">Restaurant Photo</label>
          <input required type="file" className="input-field" onChange={(e) => onFileChange('photo', e.target.files[0])} />
        </div>
        <div className="input-group">
          <label className="input-label">Menu (PDF/Image)</label>
          <input required type="file" className="input-field" onChange={(e) => onFileChange('menu', e.target.files[0])} />
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      {commonFields}
      {role !== 'customer' && authFields}
      {role === 'owner' && restaurantFields}
    </div>
  );
};

export default DynamicSignupForm;
