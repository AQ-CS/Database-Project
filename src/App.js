// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import BookList from './components/BookList';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Profile from './components/Profile';
import Book from './components/Book';
import RegStaff from './components/RegStaff';
import ProtectedRoute from './components/ProtectedRoute';
import StaffList from './components/StaffList';
import MembersList from './components/MembersList';
const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(() => {
    // Initialize user state from local storage
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Effect to handle local storage updates
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem('user');
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup the event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <Router>
      <div className="app">
        <Header user={user} setUser={setUser} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <Routes>
          <Route path="/" element={<BookList searchTerm={searchTerm} />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/profile" element={<Profile />} />
          <Route 
            path="/book" 
            element={
              <ProtectedRoute 
                user={user} 
                allowedRoles={['admin', 'staff', 'owner']} 
                element={Book} 
              />
            } 
          />
          <Route 
            path="/regstaff" 
            element={
              <ProtectedRoute 
                user={user} 
                allowedRoles={['admin', 'owner']} 
                element={RegStaff} 
              />
            } 
          />
          <Route 
            path="/stafflist" 
            element={
              <ProtectedRoute 
                user={user} 
                allowedRoles={['owner']} 
                element={StaffList} 
              />
            } 
          />
          <Route 
            path="/memberslist" 
            element={
              <ProtectedRoute 
                user={user} 
                allowedRoles={['admin', 'owner']} 
                element={MembersList} 
              />
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
