import React, { useState } from 'react';
import './RegStaff.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

const RegStaff = () => {
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    role: 'staff', // Default role set to "staff"
    email: '',
    password: '',
    contact_info: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const user = JSON.parse(localStorage.getItem('user')); // Assuming user is stored in local storage
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Log the formData before sending the request
    console.log('Submitting registration data:', formData);
  
    try {
      const response = await fetch('http://localhost:5000/api/staffUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
  
      if (!response.ok) {
        throw new Error('Failed to register user');
      }
  
      const result = await response.json();
      console.log('User registered successfully:', result); // Log the successful registration response
      setSubmissionStatus({ success: true, message: 'User registered successfully!' });
    } catch (error) {
      console.error('Error registering user:', error);
      setSubmissionStatus({ success: false, message: 'Failed to register user. Please try again.' });
    }
  };
  
  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="reg-staff-page">
      <div className="reg-staff-container">
        <h2>Register Staff</h2>
        <form onSubmit={handleSubmit}>
          <label>
            First Name:<span className="required">*</span>
            <input type="text" name="fname" value={formData.fname} onChange={handleChange} required />
          </label>
          <label>
            Last Name:<span className="required">*</span>
            <input type="text" name="lname" value={formData.lname} onChange={handleChange} required />
          </label>
          <label>
            Role:<span className="required">*</span>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="staff">Staff</option>
              {user?.user_type === 'owner' && (
                <option value="admin">Admin</option>
              )}
              
            </select>
          </label>
          <label>
            Email:<span className="required">*</span>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>
          <label>
            Password:<span className="required">*</span>
            <div className="password-container">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <span className="toggle-password" onClick={togglePasswordVisibility}>
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </span>
            </div>
          </label>
          <label>
            Contact Info:<span className="required">*</span>
            <input
              type="tel"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              required
              pattern="[0-9]{7,15}"
              placeholder="Enter your phone number"
            />
          </label>
          <button type="submit" className="submit-button">Submit</button>
        </form>
        {/* Display success or error message */}
        {submissionStatus && (
          <div className={`submission-status ${submissionStatus.success ? 'success' : 'error'}`}>
            {submissionStatus.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegStaff;
