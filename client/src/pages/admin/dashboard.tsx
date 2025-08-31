import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import KPICards from "@/components/admin/kpi-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      toast({
        title: "Access Denied",
        description: "Admin access required. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics"],
    enabled: !!user && user.role === "admin",
  });

  const { data: recentApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: ["/api/applications/recent"],
    enabled: !!user && user.role === "admin",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage opportunities and track student engagement
              </p>
            </div>
            <Link href="/admin/opportunities/new">
              <Button data-testid="button-new-opportunity">
                <i className="fas fa-plus mr-2"></i>
                New Opportunity
              </Button>
            </Link>
          </div>

          {/* KPI Cards */}
          <KPICards analytics={analytics} isLoading={analyticsLoading} />

          {/* Quick Actions and Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Link href="/admin/opportunities/new">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      data-testid="button-create-opportunity"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <i className="fas fa-plus text-primary"></i>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Create Opportunity</p>
                          <p className="text-sm text-muted-foreground">Post a new volunteering opportunity</p>
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/admin/opportunities">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      data-testid="button-view-opportunities"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-chart-1/10 rounded-full flex items-center justify-center">
                          <i className="fas fa-list text-chart-1"></i>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">View Opportunities</p>
                          <p className="text-sm text-muted-foreground">Manage all posted opportunities</p>
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/admin/analytics">
                    <Button
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      data-testid="button-view-analytics"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-chart-2/10 rounded-full flex items-center justify-center">
                          <i className="fas fa-chart-bar text-chart-2"></i>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Analytics</p>
                          <p className="text-sm text-muted-foreground">View detailed analytics</p>
                        </div>
                      </div>
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    disabled
                    data-testid="button-manage-badges"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-chart-3/10 rounded-full flex items-center justify-center">
                        <i className="fas fa-medal text-chart-3"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-medium">Manage Badges</p>
                        <p className="text-sm text-muted-foreground">Configure gamification settings</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-3">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-6 w-16" />
                      </div>
                    ))}
                  </div>
                ) : recentApplications?.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-inbox text-muted-foreground text-xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No Recent Applications</h3>
                    <p className="text-muted-foreground text-sm">
                      New applications will appear here when students apply
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentApplications?.slice(0, 5).map((application: any) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        data-testid={`recent-application-${application.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                            {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {application.user?.firstName} {application.user?.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Applied to {application.opportunity?.title}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd") : "Unknown"}
                          </p>
                          <Badge className={getStatusColor(application.status)}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {recentApplications && recentApplications.length > 5 && (
                  <div className="mt-4 text-center">
                    <Link href="/admin/applications">
                      <Button variant="outline" size="sm" data-testid="button-view-all-applications">
                        View All Applications
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Analytics Preview */}
          {analytics && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Applications Over Time</CardTitle>
                  <Link href="/admin/analytics">
                    <Button variant="outline" size="sm" data-testid="button-view-full-analytics">
                      <i className="fas fa-external-link-alt mr-2"></i>
                      View Full Analytics
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <i className="fas fa-chart-line text-4xl mb-2"></i>
                    <p>Interactive Analytics Chart</p>
                    <p className="text-sm">Shows applications trend over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
