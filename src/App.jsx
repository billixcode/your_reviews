import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReviewManagementApp from './components/ReviewManagementApp';
import DemoAuthProvider from './contexts/DemoAuthContext';

function App() {
  return (
    <DemoAuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<ReviewManagementApp />} />
            <Route path="/reviews" element={<ReviewManagementApp />} />
          </Routes>
        </div>
      </Router>
    </DemoAuthProvider>
  );
}

export default App;
