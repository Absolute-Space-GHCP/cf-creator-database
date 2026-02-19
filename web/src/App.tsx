import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import CreatorBrowse from './pages/CreatorBrowse';
import CreatorProfile from './pages/CreatorProfile';
import Admin from './pages/Admin';
import Status from './pages/Status';

export default function App() {
  return (
    <BrowserRouter basename="/app">
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/creators" element={<CreatorBrowse />} />
            <Route path="/creators/:id" element={<CreatorProfile />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/status" element={<Status />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
