import { Route, Routes } from 'react-router';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { LoginSweep } from './components/LoginSweep';
import { InventoryPage } from './pages/InventoryPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { GuestRoute } from './routes/GuestRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';

/** Root layout: header, the routed page, footer. */
export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Routes>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <InventoryPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Footer />
      <LoginSweep />
    </div>
  );
}
