import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import UsersPage from "@/pages/UsersPage";
import LawyersPage from "@/pages/LawyersPage";
import ConsultationsPage from "@/pages/ConsultationsPage";
import PaymentsPage from "@/pages/PaymentsPage";
import TicketsPage from "@/pages/TicketsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import CalendarPage from "@/pages/CalendarPage";
import TodosPage from "@/pages/TodosPage";
import MapPage from "@/pages/MapPage";
import ReviewsPage from "@/pages/ReviewsPage";
import CareerPostingsPage from "@/pages/CareerPostingsPage";
import DataRequestsPage from "@/pages/DataRequestsPage";
import DashboardLayout from "@/layouts/DashboardLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="lawyers" element={<LawyersPage />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="support" element={<TicketsPage />} />
          <Route path="reports" element={<Navigate to="/dashboard/support" replace />} />
          <Route path="disputes" element={<Navigate to="/dashboard/support" replace />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="data-requests" element={<DataRequestsPage />} />
          <Route path="tickets" element={<Navigate to="/dashboard/support" replace />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="todos" element={<TodosPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="careers" element={<CareerPostingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
