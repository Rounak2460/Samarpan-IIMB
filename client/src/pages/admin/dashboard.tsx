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
import { Progress } from "@/components/ui/progress";
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

  const { data: opportunityProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/opportunity-progress"],
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Executive Dashboard Header */}
          <section className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-8 py-12 text-white">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold">Executive Dashboard</h1>
                      <p className="text-red-100 text-lg">
                        IIMB Samarpan Platform Administration
                      </p>
                    </div>
                  </div>
                  <p className="text-red-100 max-w-2xl leading-relaxed">
                    Monitor student engagement, track social impact metrics, and manage the platform's volunteer opportunities ecosystem.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <Link href="/admin/opportunities/new">
                    <Button 
                      size="lg"
                      className="bg-white text-red-700 hover:bg-gray-50 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                      data-testid="button-new-opportunity"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Create Opportunity
                    </Button>
                  </Link>
                  <div className="text-right">
                    <div className="text-white/90 text-sm">Last Updated</div>
                    <div className="text-white font-semibold">{format(new Date(), "MMM dd, yyyy")}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KPI Cards */}
          <KPICards analytics={analytics} isLoading={analyticsLoading} />

          {/* Progress Tracker */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-chart-line text-primary"></i>
                <span>Opportunity Progress Tracker</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              ) : !opportunityProgress || opportunityProgress.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-chart-line text-muted-foreground text-4xl mb-4"></i>
                  <h3 className="text-lg font-medium mb-2">No Opportunities</h3>
                  <p className="text-muted-foreground">Create opportunities to start tracking progress</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {opportunityProgress.map((opportunity: any) => {
                    const progressPercentage = opportunity.totalRequiredHours 
                      ? Math.min((opportunity.completedHours / opportunity.totalRequiredHours) * 100, 100)
                      : 0;
                    
                    return (
                      <div key={opportunity.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">{opportunity.title}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{opportunity.totalApplications} applications</span>
                              <span>{opportunity.completedApplications} completed</span>
                              <Badge className={opportunity.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {opportunity.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {opportunity.totalRequiredHours ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Hours Progress</span>
                              <span>{opportunity.completedHours} / {opportunity.totalRequiredHours} hours</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="text-xs text-muted-foreground">
                              {progressPercentage.toFixed(1)}% complete
                              {progressPercentage >= 100 && (
                                <span className="ml-2 text-green-600 font-medium">✓ Target Reached</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No hour target set • {opportunity.completedHours} hours completed
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Executive Action Center and Activity Monitor */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Executive Action Center */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Executive Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Link href="/admin/opportunities/new">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-6 bg-gradient-to-r from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border border-red-200 rounded-xl group transition-all duration-300 hover:shadow-lg"
                      data-testid="button-create-opportunity"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-gray-900 text-lg">Create Opportunity</p>
                          <p className="text-sm text-gray-600">Launch new social impact initiatives for students</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/admin/opportunities">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-6 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl group transition-all duration-300 hover:shadow-lg"
                      data-testid="button-view-opportunities"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-gray-900 text-lg">Manage Opportunities</p>
                          <p className="text-sm text-gray-600">Review, edit and monitor all posted opportunities</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Button>
                  </Link>

                  <Link href="/admin/analytics">
                    <Button
                      variant="ghost"
                      className="w-full justify-start h-auto p-6 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border border-green-200 rounded-xl group transition-all duration-300 hover:shadow-lg"
                      data-testid="button-view-analytics"
                    >
                      <div className="flex items-center space-x-4 w-full">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-gray-900 text-lg">Impact Analytics</p>
                          <p className="text-sm text-gray-600">Comprehensive insights and performance metrics</p>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-green-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-6 bg-gradient-to-r from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-200 border border-amber-200 rounded-xl group transition-all duration-300 hover:shadow-lg opacity-75"
                    disabled
                    data-testid="button-manage-badges"
                  >
                    <div className="flex items-center space-x-4 w-full">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-500 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-semibold text-gray-900 text-lg">Badge System</p>
                        <p className="text-sm text-gray-600">Configure rewards and achievement system</p>
                      </div>
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
                        Coming Soon
                      </span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activity Monitor */}
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Live Activity Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {applicationsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                        <Skeleton className="h-8 w-20 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : recentApplications?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No Recent Activity</h3>
                    <p className="text-gray-600 text-sm">
                      Student applications will appear here as they're submitted
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentApplications?.slice(0, 5).map((application: any) => (
                      <div
                        key={application.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-md group"
                        data-testid={`recent-application-${application.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg">
                            {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900 group-hover:text-red-700 transition-colors duration-300">
                              {application.user?.firstName} {application.user?.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Applied to <span className="font-medium">{application.opportunity?.title}</span>
                            </p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-xs text-gray-500 font-medium">
                            {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd, yyyy") : "Unknown"}
                          </p>
                          <Badge className={`${getStatusColor(application.status)} border-0 font-medium px-3 py-1 rounded-full`}>
                            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {recentApplications && recentApplications.length > 5 && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <Link href="/admin/applications">
                      <Button 
                        variant="ghost" 
                        className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border border-blue-200 rounded-xl py-3 transition-all duration-300 hover:shadow-md"
                        data-testid="button-view-all-applications"
                      >
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
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
            <Card className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    Impact Analytics Overview
                  </CardTitle>
                  <Link href="/admin/analytics">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl px-4 py-2 text-green-700 hover:text-green-800 transition-all duration-300"
                      data-testid="button-view-full-analytics"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Full Analytics
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="h-64 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl flex items-center justify-center border border-green-200">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Interactive Analytics Dashboard</h3>
                    <p className="text-gray-600 mb-4">
                      Comprehensive insights into student engagement and social impact metrics
                    </p>
                    <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-lg font-bold text-green-600">📈</div>
                        <div className="text-xs text-gray-600">Trend Analysis</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-green-200">
                        <div className="text-lg font-bold text-green-600">🎯</div>
                        <div className="text-xs text-gray-600">Impact Metrics</div>
                      </div>
                    </div>
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
