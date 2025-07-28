import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ session }: { session: any }) {
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}
