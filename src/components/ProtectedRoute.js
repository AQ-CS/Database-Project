// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, allowedRoles, element: Component }) => {
  console.log('Checking ProtectedRoute:');
  console.log('User:', user);
  console.log('User Role:', user?.user_type);  // Change 'role' to 'user_type'
  console.log('Allowed Roles:', allowedRoles);

  if (!user || !allowedRoles.includes(user.user_type)) {  // Change 'role' to 'user_type'
    console.log('Redirecting to "/" due to insufficient role or no user');
    return <Navigate to="/" replace />;
  }

  return <Component />;
};

export default ProtectedRoute;
