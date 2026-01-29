import React, { useState, useEffect } from 'react';
import Gallery from './components/gallery.tsx';
import PasswordPrompt from './components/PasswordPrompt.tsx';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if already authenticated in this session
    const authStatus = sessionStorage.getItem('gallery_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <PasswordPrompt onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="App">
      <Gallery />
    </div>
  );
}

export default App;