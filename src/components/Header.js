// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate and useLocation
import './Header.css';
import logo from './library-logo.png';
import ProfilePicture from './ProfilePicture';

const Header = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current URL path
  const [user, setUser] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    setUser(loggedInUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownVisible((prev) => !prev);
  };

  const handleViewProfile = () => {
    navigate('/profile');
    setDropdownVisible(false);
  };

  return (
    <header className="header">
      <div className="logo-container">
        <img 
          src={logo} 
          alt="Library Logo" 
          className="library-logo" 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        />
        <h1 
          className="library-name" 
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          Database Library Project
        </h1>
      </div>
      <div className="header-actions">
        {user ? (
          <div className="profile-container">
            <div onClick={toggleDropdown} style={{ cursor: 'pointer' }}>
              <ProfilePicture userId={user.id} />
            </div>
            {dropdownVisible && (
              <div className="dropdown-menu">
                <button onClick={handleViewProfile}>View Profile</button>
                <button onClick={handleLogout}>Sign Out</button>
              </div>
            )}
          </div>
        ) : location.pathname !== '/login' ? (
          <button className="login-button" onClick={() => navigate('/login')}>
            Login
          </button>
        ) : null}

      </div>
    </header>
  );
};

export default Header;
