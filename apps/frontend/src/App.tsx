import { AnonAadhaarProvider } from '@anon-aadhaar/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import VerifyPage from './pages/Verify';
import DashboardPage from './pages/Dashboard';
// DigiLocker flow removed
import { useEffect } from 'react';

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
    <AnonAadhaarProvider _appId="did-overnight-demo" _useTestAadhaar={true}>
      <BrowserRouter>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                <Route path="/" element={<VerifyPage />} />
                {/** DigiLocker route removed */}
                <Route path="/dashboard" element={<DashboardPage />} />
              </Routes>
            </div>
      </BrowserRouter>
    </AnonAadhaarProvider>
  );
}

export default App;
