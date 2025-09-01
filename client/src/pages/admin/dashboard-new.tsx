import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { ApplicationWithDetails, OpportunityWithCreator } from "@shared/schema";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: opportunities, isLoading: opportunitiesLoading } = useQuery<OpportunityWithCreator[]>({
    queryKey: ["/api/admin/opportunities"],
    enabled: !!user && user.role === "admin",
  });

  const { data: allApplications, isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ["/api/admin/applications"],
    enabled: !!user && user.role === "admin",
  });

  // Application management mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (data: {
      applicationId: string;
      status: string;
      notes?: string;
    }) => {
      await apiRequest("PUT", `/api/applications/${data.applicationId}/status`, {
        status: data.status,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Success",
        description: "Application status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
    },
    onError: (error) => {
      toast({
        title: "❌ Error", 
        description: "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  const approveHoursMutation = useMutation({
    mutationFn: async ({ applicationId, coinsAwarded }: {
      applicationId: string;
      coinsAwarded: number;
    }) => {
      await apiRequest("POST", `/api/applications/${applicationId}/approve-hours`, {
        coinsAwarded,
        feedback: "Hours approved by admin",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({
        title: "🎉 Hours Approved!",
        description: "Student has been awarded coins for their work",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: "Failed to approve hours",
        variant: "destructive",
      });
    },
  });

  const rejectHoursMutation = useMutation({
    mutationFn: async ({ applicationId, feedback }: {
      applicationId: string;
      feedback: string;
    }) => {
      await apiRequest("POST", `/api/applications/${applicationId}/reject-hours`, {
        feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({
        title: "📝 Hours Rejected",
        description: "Feedback sent to student",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: "Failed to reject hours",
        variant: "destructive",
      });
    },
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

  const pendingApplications = (allApplications || []).filter(app => app.status === "pending");
  const hoursToReview = (allApplications || []).filter(app => app.status === "hours_submitted");
  const recentlyCompleted = (allApplications || []).filter(app => app.status === "completed" || app.status === "hours_approved").slice(0, 5);
  const activeOpportunities = (opportunities || []).filter(opp => opp.status === "open");

  const getUrgencyColor = (count: number) => {
    if (count === 0) return "bg-green-50 border-green-200";
    if (count <= 3) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getUrgencyBadgeColor = (count: number) => {
    if (count === 0) return "bg-green-100 text-green-800";
    if (count <= 3) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎯 Admin Command Center
            </h1>
            <p className="text-lg text-gray-600">
              Manage opportunities and review student progress in one place
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className={`${getUrgencyColor(pendingApplications.length)} border-2`}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{pendingApplications.length}</div>
                <div className="text-sm font-medium text-gray-600">Pending Applications</div>
                <Badge className={`mt-2 ${getUrgencyBadgeColor(pendingApplications.length)}`}>
                  {pendingApplications.length === 0 ? "All caught up!" : "Needs attention"}
                </Badge>
              </CardContent>
            </Card>

            <Card className={`${getUrgencyColor(hoursToReview.length)} border-2`}>
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{hoursToReview.length}</div>
                <div className="text-sm font-medium text-gray-600">Hours to Review</div>
                <Badge className={`mt-2 ${getUrgencyBadgeColor(hoursToReview.length)}`}>
                  {hoursToReview.length === 0 ? "All caught up!" : "Needs review"}
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-2 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{activeOpportunities.length}</div>
                <div className="text-sm font-medium text-gray-600">Active Opportunities</div>
                <Badge className="bg-blue-100 text-blue-800 mt-2">Running</Badge>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-2 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{recentlyCompleted.length}</div>
                <div className="text-sm font-medium text-gray-600">Recently Completed</div>
                <Badge className="bg-green-100 text-green-800 mt-2">Success</Badge>
              </CardContent>
            </Card>
          </div>

          {/* Action Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pending Applications */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardTitle className="flex items-center">
                  <i className="fas fa-clock mr-3"></i>
                  🚨 Pending Applications ({pendingApplications.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : pendingApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-green-500 text-4xl mb-3"></i>
                    <p className="text-gray-600">All applications reviewed!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingApplications.map((application) => (
                      <div key={application.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                              {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {application.user?.firstName} {application.user?.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{application.opportunity?.title}</p>
                              <p className="text-xs text-gray-500">
                                📅 Applied {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd") : "Unknown"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                updateStatusMutation.mutate({
                                  applicationId: application.id,
                                  status: "accepted",
                                  notes: "Application accepted by admin",
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-quick-accept-${application.id}`}
                            >
                              ✅ Accept
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                updateStatusMutation.mutate({
                                  applicationId: application.id,
                                  status: "rejected",
                                  notes: "Application rejected by admin",
                                });
                              }}
                              data-testid={`button-quick-reject-${application.id}`}
                            >
                              ❌ Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hours to Review */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <CardTitle className="flex items-center">
                  <i className="fas fa-clock mr-3"></i>
                  ⏰ Hours to Review ({hoursToReview.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : hoursToReview.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-check-circle text-green-500 text-4xl mb-3"></i>
                    <p className="text-gray-600">All hours reviewed!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {hoursToReview.map((application) => (
                      <div key={application.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">
                                {application.user?.firstName} {application.user?.lastName}
                              </p>
                              <p className="text-sm text-gray-600">{application.opportunity?.title}</p>
                              <div className="flex items-center space-x-4 mt-1">
                                <p className="text-sm font-medium text-purple-600">
                                  ⏱️ {application.submittedHours || 0} hours submitted
                                </p>
                                <p className="text-xs text-gray-500">
                                  💰 {(application.submittedHours || 0) * (application.opportunity?.coinsPerHour || 10)} coins
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const coinsAwarded = (application.submittedHours || 0) * (application.opportunity?.coinsPerHour || 10);
                                approveHoursMutation.mutate({
                                  applicationId: application.id,
                                  coinsAwarded,
                                });
                              }}
                              className="bg-green-600 hover:bg-green-700"
                              data-testid={`button-approve-hours-${application.id}`}
                            >
                              ✅ Approve ({(application.submittedHours || 0) * (application.opportunity?.coinsPerHour || 10)} coins)
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                const feedback = prompt("📝 Provide feedback for rejection:");
                                if (feedback) {
                                  rejectHoursMutation.mutate({
                                    applicationId: application.id,
                                    feedback,
                                  });
                                }
                              }}
                              data-testid={`button-reject-hours-${application.id}`}
                            >
                              ❌ Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recently Completed */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white">
              <CardTitle className="flex items-center">
                <i className="fas fa-trophy mr-3"></i>
                🏆 Recently Completed Work
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {applicationsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full" />
                  ))}
                </div>
              ) : recentlyCompleted.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-history text-gray-400 text-4xl mb-3"></i>
                  <p className="text-gray-600">No completed work yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentlyCompleted.map((application) => (
                    <div key={application.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {application.user?.firstName} {application.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{application.user?.email}</p>
                        </div>
                      </div>
                      <h4 className="font-medium text-sm text-gray-800 mb-2">{application.opportunity?.title}</h4>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>⏱️ {application.hoursCompleted || application.submittedHours || 0}h</span>
                        <span>💰 {application.coinsAwarded || 0} coins</span>
                        <Badge className="bg-green-100 text-green-800">
                          ✅ Complete
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Opportunities Management */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className="fas fa-tasks mr-3"></i>
                  🎯 Active Opportunities ({activeOpportunities.length})
                </div>
                <Link href="/admin/opportunities/new">
                  <Button variant="secondary" size="sm" data-testid="button-new-opportunity">
                    <i className="fas fa-plus mr-2"></i>
                    Create New
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {opportunitiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : activeOpportunities.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-plus-circle text-blue-500 text-4xl mb-3"></i>
                  <p className="text-gray-600 mb-4">No active opportunities</p>
                  <Link href="/admin/opportunities/new">
                    <Button data-testid="button-create-first-opportunity">
                      <i className="fas fa-plus mr-2"></i>
                      Create Your First Opportunity
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeOpportunities.map((opportunity) => {
                    const opportunityApplications = (allApplications || []).filter(app => app.opportunityId === opportunity.id);
                    const acceptedCount = opportunityApplications.filter(app => app.status === "accepted").length;
                    const completedCount = opportunityApplications.filter(app => app.status === "completed" || app.status === "hours_approved").length;
                    
                    return (
                      <div key={opportunity.id} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-1">{opportunity.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{opportunity.shortDescription}</p>
                            <Badge variant="outline" className="capitalize text-xs">
                              {opportunity.type}
                            </Badge>
                          </div>
                          <Link href={`/admin/opportunities/${opportunity.id}/edit`}>
                            <Button variant="ghost" size="sm" data-testid={`button-edit-${opportunity.id}`}>
                              <i className="fas fa-edit text-gray-500"></i>
                            </Button>
                          </Link>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">📊 Progress</span>
                            <span className="font-medium">{completedCount} / {opportunityApplications.length} completed</span>
                          </div>
                          
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                width: opportunityApplications.length > 0 
                                  ? `${(completedCount / opportunityApplications.length) * 100}%` 
                                  : '0%' 
                              }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>👥 {opportunityApplications.length} total applications</span>
                            <span>✅ {acceptedCount} accepted</span>
                            <span>🏆 {completedCount} completed</span>
                          </div>

                          <div className="flex space-x-2 pt-2">
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-gray-700 to-gray-900 text-white">
              <CardTitle className="flex items-center">
                <i className="fas fa-lightning-bolt mr-3"></i>
                ⚡ Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/admin/opportunities/new">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700" data-testid="button-quick-new-opportunity">
                    <i className="fas fa-plus text-2xl mb-2"></i>
                    <span className="text-sm">New Opportunity</span>
                  </Button>
                </Link>
                
                
                <Link href="/admin/analytics">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-green-600 hover:bg-green-700" data-testid="button-quick-analytics">
                    <i className="fas fa-chart-bar text-2xl mb-2"></i>
                    <span className="text-sm">Analytics</span>
                  </Button>
                </Link>
                
                <Button 
                  className="w-full h-20 flex flex-col items-center justify-center bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/admin/opportunities"] });
                    toast({
                      title: "🔄 Refreshed",
                      description: "All data has been refreshed",
                    });
                  }}
                  data-testid="button-refresh-all"
                >
                  <i className="fas fa-sync-alt text-2xl mb-2"></i>
                  <span className="text-sm">Refresh All</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}