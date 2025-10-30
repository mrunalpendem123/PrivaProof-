import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VerifyPage from './pages/Verify';
import { useEffect } from 'react';
import VerifierProPage from './pages/VerifierPro';

function App() {
  useEffect(() => {
    // Global error handler for Anon Aadhaar errors
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('Cannot convert undefined to a BigInt')) {
        console.warn('Anon Aadhaar BigInt error caught, continuing with test data');
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-950 text-gray-100">
        <Routes>
          <Route path="/" element={<VerifyPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/verifier" element={<VerifierProPage />} />
          <Route path="/verifier-pro" element={<VerifierProPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
