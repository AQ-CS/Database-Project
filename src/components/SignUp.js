import React, { useState } from 'react';
import './SignUp.css'; // Ensure this file contains styles matching your theme
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // Import FontAwesome for icons
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons'; // Eye and eye-slash icons

const SignUp = () => {
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    postalCode: '',
    birthday: '',
    gender: 'Male', // Default to Male
    fname: '',
    lname: '',
    email: '',
    password: '',
    phone: '', // New phone field
  });
  const [showPassword, setShowPassword] = useState(false); // State to manage password visibility

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Set the content type to JSON
        },
        body: JSON.stringify(formData), // Convert form data to JSON
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();
      console.log('User registered successfully:', result);
      // Optionally, you can redirect or show a success message here
    } catch (error) {
      console.error('Error registering user:', error);
      // Handle error (show a message to the user, etc.)
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="sign-up-page"> {/* Wrapper for centering */}
      <div className="sign-up-container">
        <h2>Sign Up</h2>
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
            Phone Number:<span className="required">*</span>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              pattern="[0-9]{7,15}" // Basic validation pattern for phone numbers
              placeholder="Enter your phone number"
            />
          </label>
          <label>
            Street:<span className="required">*</span>
            <input type="text" name="street" value={formData.street} onChange={handleChange} />
          </label>
          <label>
            City:<span className="required">*</span>
            <input type="text" name="city" value={formData.city} onChange={handleChange} />
          </label>
          <label>
            Postal Code:<span className="required">*</span>
            <input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} />
          </label>
          <button type="submit" className="submit-button">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
