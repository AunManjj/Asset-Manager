import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getHomePath } from "@/lib/roles";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { user, token, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !token) {
      setLocation("/");
    }
  }, [token, isLoading, setLocation]);

  useEffect(() => {
    if (!isLoading && token && user && allowedRoles && !allowedRoles.includes(user.role)) {
      setLocation(getHomePath(user.role));
    }
  }, [isLoading, token, user, allowedRoles, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#F5F0E8]">
        <Spinner className="text-primary size-8" />
      </div>
    );
  }

  if (!token || !user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
