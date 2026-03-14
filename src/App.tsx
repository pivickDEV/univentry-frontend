import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "./components/layouts/MainLayout";
import ProtectedRoute from "./components/layouts/ProtectedRoute";
import PublicRoute from "./components/layouts/PublicRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AuditTrail from "./pages/admin/AuditTrail";
import CCTVMonitor from "./pages/admin/CCTVMonitor";
import OfficeManagement from "./pages/admin/OfficeManagement";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import UserManagement from "./pages/admin/UserManagement";
import BookAppointment from "./pages/BookAppointment";
import ActiveLog from "./pages/guard/ActiveLog";
import GateScanner from "./pages/guard/GateScanner";
import GuardDashboard from "./pages/guard/GuardDashboard";
import ManualEntry from "./pages/guard/ManualEntry";
import Home from "./pages/Home";
import Login from "./pages/Login";
import DepartmentHistory from "./pages/office/DepartmentHistory";
import OfficeDashboard from "./pages/office/OfficeDashboard";
import TransactionScan from "./pages/office/TransactionScan";

const App = () => {
  return (
    <Routes>
      {/* ================= PUBLIC ROUTES ================= */}
      {/* If logged IN, these redirect you to your dashboard */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/book-appointment" element={<BookAppointment />} />
        <Route path="/" element={<Home />} />
      </Route>

      {/* ================= PROTECTED ROUTES ================= */}
      {/* Must be logged in WITH the correct role to access */}
      <Route element={<MainLayout />}>
        {/* Admin-only routes */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/audit-trail" element={<AuditTrail />} />
          <Route path="/admin/reports" element={<ReportsAnalytics />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/offices" element={<OfficeManagement />} />
          <Route path="/admin/cctv-monitor" element={<CCTVMonitor />} />
        </Route>

        {/* Office-only routes */}
        <Route element={<ProtectedRoute allowedRoles={["office"]} />}>
          <Route path="/office" element={<OfficeDashboard />} />
          <Route path="/office/transactions" element={<TransactionScan />} />
          <Route
            path="/office/department-history"
            element={<DepartmentHistory />}
          />
        </Route>

        {/* Guard-only routes */}
        <Route element={<ProtectedRoute allowedRoles={["guard"]} />}>
          <Route path="/guard" element={<GuardDashboard />} />
          <Route path="/guard/scanner" element={<GateScanner />} />
          <Route path="/guard/manual-entry" element={<ManualEntry />} />
          <Route path="/guard/active-log" element={<ActiveLog />} />
        </Route>
      </Route>

      {/* Fallback - Catches any typos in URL */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
