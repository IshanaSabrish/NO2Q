import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/store';

// Pages
import Home from './pages/customer/Home';
import RestaurantDetails from './pages/customer/RestaurantDetails';
import LiveTracking from './pages/customer/LiveTracking';
import QRScanner from './pages/customer/QRScanner';
import OwnerDashboard from './pages/owner/Dashboard';
import Signup from './pages/Signup';
import InitialSetup from './pages/owner/InitialSetup';
import PublicDisplay from './pages/owner/PublicDisplay';
import AdminDashboard from './pages/admin/Dashboard';
import Login from './pages/Login';
import WaitingApproval from './pages/WaitingApproval';

const PrivateRoute = ({ children, roleRequired }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) return <Navigate to="/login" />;
  if (roleRequired && user.role !== roleRequired) return <Navigate to="/login" />;
  
  // Strict status check for owner
  if (user.role === 'owner' && user.status === 'pending') {
     if (window.location.pathname === '/owner-dashboard' || window.location.pathname === '/owner/setup') {
        return <Navigate to="/waiting-approval" />;
     }
  }
  
  return children;
};

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Router>
      <Routes>
          {/* Public Routes */}
          <Route path="/" element={
            user ? 
              (user.role === 'admin' ? <Navigate to="/admin-dashboard" /> : 
               user.role === 'owner' ? <Navigate to="/owner-dashboard" /> : 
               <Navigate to="/home" />) 
            : <Navigate to="/login" />
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Customer Routes */}
          <Route path="/home" element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          } />
          <Route path="/scan" element={
            <PrivateRoute>
              <QRScanner />
            </PrivateRoute>
          } />
          <Route path="/restaurant/:id" element={
            <PrivateRoute>
              <RestaurantDetails />
            </PrivateRoute>
          } />
          <Route path="/live-tracking/:tokenId" element={
            <PrivateRoute>
              <LiveTracking />
            </PrivateRoute>
          } />
          
          {/* Owner Routes */}
          <Route path="/owner-dashboard" element={
            <PrivateRoute roleRequired="owner">
              <OwnerDashboard />
            </PrivateRoute>
          } />
          <Route path="/waiting-approval" element={<WaitingApproval />} />
          <Route path="/owner/setup" element={
            <PrivateRoute roleRequired="owner">
              <InitialSetup />
            </PrivateRoute>
          } />
          <Route path="/owner/display" element={
            <PrivateRoute roleRequired="owner">
              <PublicDisplay />
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin-dashboard" element={
            <PrivateRoute roleRequired="admin">
              <AdminDashboard />
            </PrivateRoute>
          } />
        </Routes>
    </Router>
  );
}

export default App;
