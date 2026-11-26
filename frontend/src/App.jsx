import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './pages/AdminDashboard';
import ExhibitorPortal from './pages/ExhibitorPortal';
import AttendeeApp from './attendee/AttendeeApp';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['exhibitor']} />}>
          <Route path="/exhibitor/*" element={<ExhibitorPortal />} />
        </Route>

        <Route path="/*" element={<AttendeeApp />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;