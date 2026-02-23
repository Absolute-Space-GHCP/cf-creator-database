import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ErrorBoundary from './components/ui/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import CreatorBrowse from './pages/CreatorBrowse';
import CreatorProfile from './pages/CreatorProfile';
import Admin from './pages/Admin';
import Status from './pages/Status';
import HowItWorks from './pages/HowItWorks';
import Login from './pages/Login';
import ScraperDashboard from './pages/ScraperDashboard';

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename="/app">
        <div className="app-shell">
          <Header />
          <main className="app-main">
            <ErrorBoundary>
              <Routes>
                <Route path="/creators" element={<CreatorBrowse />} />
                <Route path="/creators/:id" element={<CreatorProfile />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/status" element={<Status />} />
                <Route path="/scraper" element={<ScraperDashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}
