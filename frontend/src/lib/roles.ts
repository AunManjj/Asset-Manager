export function getHomePath(role?: string | null): string {
  switch (role) {
    case "setter":
      return "/setters";
    case "closer":
      return "/closers";
    case "admin":
    case "client":
      return "/dashboard";
    default:
      return "/dashboard";
  }
}

export function canAccessDashboard(role?: string | null): boolean {
  return role === "admin" || role === "client";
}
