import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Header() {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const isActiveRoute = (route: string) => {
    if (route === "/" && location === "/") return true;
    if (route !== "/" && location.startsWith(route)) return true;
    return false;
  };

  return (
    <nav className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
              <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <i className="fas fa-hands-helping text-lg"></i>
              </div>
              <span className="text-xl font-bold text-foreground">IIMB Samarpan</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" data-testid="nav-opportunities">
              <span className={`font-medium transition-colors duration-200 ${
                isActiveRoute("/") && !location.startsWith("/admin") 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}>
                Opportunities
              </span>
            </Link>
            <Link href="/leaderboard" data-testid="nav-leaderboard">
              <span className={`font-medium transition-colors duration-200 ${
                isActiveRoute("/leaderboard") 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              }`}>
                Leaderboard
              </span>
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" data-testid="nav-admin">
                <span className={`font-medium transition-colors duration-200 ${
                  isActiveRoute("/admin") 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                }`}>
                  Admin
                </span>
              </Link>
            )}
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                {/* Coins Display */}
                <div className="hidden sm:flex items-center space-x-2 bg-muted rounded-full px-3 py-1">
                  <div className="coin-icon">₹</div>
                  <span className="text-sm font-semibold" data-testid="text-header-coins">
                    {user.coins || 0}
                  </span>
                  <span className="text-xs text-muted-foreground">coins</span>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full"
                      data-testid="button-user-menu"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profileImageUrl} alt={user.firstName} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium leading-none" data-testid="text-user-name">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground" data-testid="text-user-email">
                        {user.email}
                      </p>
                      {user.role === "admin" && (
                        <Badge variant="secondary" className="w-fit">
                          Admin
                        </Badge>
                      )}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" data-testid="menu-profile">
                        <i className="fas fa-user mr-2"></i>
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" data-testid="menu-admin">
                          <i className="fas fa-cog mr-2"></i>
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => window.location.href = '/api/logout'}
                      data-testid="menu-logout"
                    >
                      <i className="fas fa-sign-out-alt mr-2"></i>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-login"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
