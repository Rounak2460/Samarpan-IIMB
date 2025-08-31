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
import iimbLogo from "@assets/IIM_Bangalore_Logo.svg_1756641864794.png";

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
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-lg">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-4 group" data-testid="link-home">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-red-100 group-hover:from-red-100 group-hover:to-red-200 transition-all duration-300">
                <img 
                  src={iimbLogo} 
                  alt="IIM Bangalore" 
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
                  IIMB Samarpan
                </span>
                <span className="text-xs text-gray-600 font-medium tracking-wide uppercase">
                  Social Impact Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link href="/" data-testid="nav-opportunities">
              <Button
                variant="ghost"
                className={`px-6 py-2 text-sm font-semibold transition-all duration-300 relative ${
                  isActiveRoute("/") && !location.startsWith("/admin") 
                    ? "text-red-600 bg-red-50 hover:bg-red-100" 
                    : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>Opportunities</span>
                </span>
                {isActiveRoute("/") && !location.startsWith("/admin") && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-full"></div>
                )}
              </Button>
            </Link>
            <Link href="/leaderboard" data-testid="nav-leaderboard">
              <Button
                variant="ghost"
                className={`px-6 py-2 text-sm font-semibold transition-all duration-300 relative ${
                  isActiveRoute("/leaderboard") 
                    ? "text-red-600 bg-red-50 hover:bg-red-100" 
                    : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                }`}
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Leaderboard</span>
                </span>
                {isActiveRoute("/leaderboard") && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-full"></div>
                )}
              </Button>
            </Link>
            {user?.role === "student" && (
              <Link href="/dashboard" data-testid="nav-dashboard">
                <Button
                  variant="ghost"
                  className={`px-6 py-2 text-sm font-semibold transition-all duration-300 relative ${
                    isActiveRoute("/dashboard") 
                      ? "text-red-600 bg-red-50 hover:bg-red-100" 
                      : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>My Dashboard</span>
                  </span>
                  {isActiveRoute("/dashboard") && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-full"></div>
                  )}
                </Button>
              </Link>
            )}
            {user?.role === "admin" && (
              <Link href="/admin" data-testid="nav-admin">
                <Button
                  variant="ghost"
                  className={`px-6 py-2 text-sm font-semibold transition-all duration-300 relative ${
                    isActiveRoute("/admin") 
                      ? "text-red-600 bg-red-50 hover:bg-red-100" 
                      : "text-gray-700 hover:text-red-600 hover:bg-red-50"
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Admin</span>
                  </span>
                  {isActiveRoute("/admin") && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-red-600 rounded-full"></div>
                  )}
                </Button>
              </Link>
            )}
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-6">
            {isAuthenticated && user ? (
              <>
                {/* Coins Display */}
                <div className="hidden sm:flex items-center space-x-3 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl px-4 py-2 border border-yellow-200">
                  <div className="coin-icon">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg font-bold text-amber-700" data-testid="text-header-coins">
                      {user.coins || 0}
                    </span>
                    <span className="text-xs text-amber-600 font-medium -mt-1">coins</span>
                  </div>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-12 rounded-xl px-3 py-2 hover:bg-red-50 transition-all duration-300"
                      data-testid="button-user-menu"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10 ring-2 ring-red-100 ring-offset-2">
                          <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName || ''} />
                          <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold">
                            {getInitials(user.firstName || '', user.lastName || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="hidden lg:flex flex-col items-start">
                          <span className="text-sm font-semibold text-gray-900">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.role === "admin" ? "Administrator" : "Student"}
                          </span>
                        </div>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-72 p-4 shadow-xl border-0 bg-white" align="end" forceMount>
                    <div className="flex items-start space-x-4 p-2">
                      <Avatar className="h-12 w-12 ring-2 ring-red-100">
                        <AvatarImage src={user.profileImageUrl || ''} alt={user.firstName || ''} />
                        <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold text-lg">
                          {getInitials(user.firstName || '', user.lastName || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col space-y-1">
                        <p className="text-base font-semibold text-gray-900" data-testid="text-user-name">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-600" data-testid="text-user-email">
                          {user.email}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          {user.role === "admin" ? (
                            <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-sm">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                              </svg>
                              Administrator
                            </Badge>
                          ) : (
                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-sm">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                              </svg>
                              Student
                            </Badge>
                          )}
                          <div className="coin-icon scale-75">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-amber-700">{user.coins || 0}</span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="my-3" />
                    <div className="space-y-1">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center p-3 rounded-lg hover:bg-red-50 transition-colors" data-testid="menu-profile">
                          <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">Profile</span>
                            <span className="text-xs text-gray-500">View and edit your profile</span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                      {user.role === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center p-3 rounded-lg hover:bg-red-50 transition-colors" data-testid="menu-admin">
                            <svg className="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">Admin Dashboard</span>
                              <span className="text-xs text-gray-500">Manage platform and users</span>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </div>
                    <DropdownMenuSeparator className="my-3" />
                    <DropdownMenuItem
                      onClick={async () => {
                        try {
                          await fetch('/api/logout', { 
                            method: 'POST', 
                            credentials: 'include' 
                          });
                          window.location.href = '/';
                        } catch (error) {
                          console.error('Logout error:', error);
                          window.location.href = '/';
                        }
                      }}
                      className="flex items-center p-3 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
                      data-testid="menu-logout"
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <div className="flex flex-col">
                        <span className="font-medium">Sign Out</span>
                        <span className="text-xs text-gray-500">Logout from your account</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = '/login'}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-8 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                data-testid="button-login"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
