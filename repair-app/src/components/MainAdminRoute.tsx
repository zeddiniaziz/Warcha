import { Navigate } from "react-router-dom";

const MainAdminRoute = ({
  isSubAdmin,
  children,
  redirectTo = "/admins",
}: {
  isSubAdmin: boolean;
  children: React.ReactNode;
  redirectTo?: string;
}) => {
  // Only allow if NOT sub-admin (i.e., main admin)
  if (isSubAdmin) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
};

export default MainAdminRoute;
