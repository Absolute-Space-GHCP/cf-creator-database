import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import CreatorBrowse from './pages/CreatorBrowse';
import CreatorProfile from './pages/CreatorProfile';
import BriefMatch from './pages/BriefMatch';
import SearchResults from './pages/SearchResults';
import Admin from './pages/Admin';
import Status from './pages/Status';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Header />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/creators" element={<CreatorBrowse />} />
            <Route path="/creators/:id" element={<CreatorProfile />} />
            <Route path="/match" element={<BriefMatch />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/status" element={<Status />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
