import React, { createContext, useContext, useState, useEffect } from 'react';

const DemoAuthContext = createContext();

export const useDemoAuth = () => {
  const context = useContext(DemoAuthContext);
  if (!context) {
    throw new Error('useDemoAuth must be used within a DemoAuthProvider');
  }
  return context;
};

const DemoAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and then set a demo user
    const timer = setTimeout(() => {
      setUser({
        uid: 'demo_user_123',
        email: 'demo@example.com',
        displayName: 'Demo User'
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user
  };

  return (
    <DemoAuthContext.Provider value={value}>
      {children}
    </DemoAuthContext.Provider>
  );
};

export default DemoAuthProvider;
