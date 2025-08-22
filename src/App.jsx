import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReviewManagementApp from './components/ReviewManagementApp';
import AuthProvider from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<ReviewManagementApp />} />
            <Route path="/reviews" element={<ReviewManagementApp />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
