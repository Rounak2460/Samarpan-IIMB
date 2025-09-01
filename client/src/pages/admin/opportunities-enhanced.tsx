import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import type { OpportunityWithCreator, ApplicationWithDetails } from "@shared/schema";

export default function AdminOpportunities() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null);

  const { data: opportunities, isLoading } = useQuery<OpportunityWithCreator[]>({
    queryKey: ["/api/admin/opportunities"],
    enabled: !!user && user.role === "admin",
  });

  const { data: allApplications, isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ["/api/admin/applications"],
    enabled: !!user && user.role === "admin",
  });

  const { data: opportunityProgress, isLoading: progressLoading } = useQuery({
    queryKey: ["/api/opportunity-progress"],
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
      queryClient.invalidateQueries({ queryKey: ["/api/opportunity-progress"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/opportunity-progress"] });
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

  const closeOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      await apiRequest("PATCH", `/api/opportunities/${opportunityId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/opportunities"] });
      toast({
        title: "🔒 Opportunity Closed",
        description: "Students can no longer apply to this opportunity",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: "Failed to close opportunity",
        variant: "destructive",
      });
    },
  });

  const deleteOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      await apiRequest("DELETE", `/api/opportunities/${opportunityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/opportunities"] });
      toast({
        title: "🗑️ Opportunity Deleted",
        description: "Opportunity has been permanently removed",
      });
    },
    onError: (error) => {
      toast({
        title: "❌ Error",
        description: "Failed to delete opportunity",
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

  // Filter opportunities
  const filteredOpportunities = (opportunities || []).filter((opportunity) => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || opportunity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getApplicationsForOpportunity = (opportunityId: string) => {
    return (allApplications || []).filter(app => app.opportunityId === opportunityId);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-red-100 text-red-800";
      case "filled": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "hours_submitted": return "bg-purple-100 text-purple-800";
      case "hours_approved": return "bg-green-100 text-green-800";
      case "completed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const toggleOpportunityExpansion = (opportunityId: string) => {
    if (expandedOpportunity === opportunityId) {
      setExpandedOpportunity(null);
    } else {
      setExpandedOpportunity(opportunityId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🎯 Opportunity & Application Manager
            </h1>
            <p className="text-lg text-gray-600">
              Manage opportunities and review applications in an integrated workflow
            </p>
          </div>

          {/* Filters and Search */}
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Input
                      type="text"
                      placeholder="🔍 Search opportunities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-12 text-lg"
                      data-testid="input-search-opportunities"
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 h-12" data-testid="select-status-filter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="filled">Filled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Link href="/admin/opportunities/new">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-12" data-testid="button-new-opportunity">
                    <i className="fas fa-plus mr-2"></i>
                    Create New Opportunity
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities List */}
          <div className="space-y-6">
            {isLoading || applicationsLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full" />
                ))}
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <Card className="shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-plus-circle text-blue-500 text-3xl"></i>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Opportunities Found</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your filters to see more opportunities" 
                      : "Create your first opportunity to get students engaged in social work"
                    }
                  </p>
                  <Link href="/admin/opportunities/new">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700" data-testid="button-create-first-opportunity">
                      <i className="fas fa-plus mr-2"></i>
                      Create Your First Opportunity
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredOpportunities.map((opportunity) => {
                const opportunityApplications = getApplicationsForOpportunity(opportunity.id);
                const pendingCount = opportunityApplications.filter(app => app.status === "pending").length;
                const hoursSubmittedCount = opportunityApplications.filter(app => app.status === "hours_submitted").length;
                const completedCount = opportunityApplications.filter(app => app.status === "completed" || app.status === "hours_approved").length;
                const acceptedCount = opportunityApplications.filter(app => app.status === "accepted").length;
                
                // Get real-time progress data from server
                const progressData = (opportunityProgress || []).find((p: any) => p.id === opportunity.id);
                const approvedHours = progressData ? progressData.completedHours : 0;
                const totalRequiredHours = opportunity.totalRequiredHours || 0;
                const progressPercentage = totalRequiredHours > 0 
                  ? Math.min((approvedHours / totalRequiredHours) * 100, 100) 
                  : 0;

                return (
                  <Card key={opportunity.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl mb-2">{opportunity.title}</CardTitle>
                          <p className="text-blue-100">{opportunity.shortDescription}</p>
                          <div className="flex items-center space-x-4 mt-3">
                            <Badge className="bg-white/20 text-white border-white/30">
                              📅 {opportunity.createdAt ? format(new Date(opportunity.createdAt), "MMM dd, yyyy") : "Unknown"}
                            </Badge>
                            <Badge className="bg-white/20 text-white border-white/30 capitalize">
                              🏷️ {opportunity.type}
                            </Badge>
                            <Badge className={`${opportunity.status === 'open' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                              {opportunity.status === 'open' ? '🟢 Active' : '🔴 Closed'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="secondary"
                            onClick={() => toggleOpportunityExpansion(opportunity.id)}
                            data-testid={`button-toggle-applications-${opportunity.id}`}
                            className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                          >
                            <i className={`fas ${expandedOpportunity === opportunity.id ? 'fa-chevron-up' : 'fa-chevron-down'} mr-2`}></i>
                            {expandedOpportunity === opportunity.id ? 'Hide' : 'Show'} Applications
                          </Button>
                          <Link href={`/admin/opportunities/${opportunity.id}/edit`}>
                            <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30" data-testid={`button-edit-${opportunity.id}`}>
                              <i className="fas fa-edit"></i>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-6">
                      {/* Application Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold text-yellow-800">{pendingCount}</div>
                          <div className="text-sm text-yellow-600">⏳ Pending</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-2xl font-bold text-blue-800">{acceptedCount}</div>
                          <div className="text-sm text-blue-600">👍 Accepted</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="text-2xl font-bold text-purple-800">{hoursSubmittedCount}</div>
                          <div className="text-sm text-purple-600">⏰ Hours Submitted</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <div className="text-2xl font-bold text-green-800">{completedCount}</div>
                          <div className="text-sm text-green-600">🏆 Completed</div>
                        </div>
                      </div>

                      {/* Progress Bar Section */}
                      {totalRequiredHours > 0 && (
                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">📊 Cumulative Hours Progress</span>
                            <span className="text-sm font-semibold text-gray-800">{approvedHours} hrs completed out of {totalRequiredHours} required</span>
                          </div>
                          <Progress value={progressPercentage} className="h-3" />
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500">
                              {progressPercentage.toFixed(1)}% complete
                            </span>
                            {progressPercentage >= 100 && (
                              <span className="text-xs text-green-600 font-medium">✓ Target Reached</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Expanded Applications Section */}
                      {expandedOpportunity === opportunity.id && (
                        <div className="border-t pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold flex items-center text-lg">
                              <i className="fas fa-users mr-3 text-blue-600"></i>
                              Applications Management ({opportunityApplications.length} total)
                            </h4>
                            
                            {/* Close/Remove Actions */}
                            <div className="flex space-x-2">
                              {opportunity.status === 'open' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => closeOpportunityMutation.mutate(opportunity.id)}
                                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                  data-testid={`button-close-${opportunity.id}`}
                                >
                                  <i className="fas fa-lock mr-2"></i>
                                  Close
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to permanently delete this opportunity? This action cannot be undone.')) {
                                    deleteOpportunityMutation.mutate(opportunity.id);
                                  }
                                }}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                                data-testid={`button-delete-${opportunity.id}`}
                              >
                                <i className="fas fa-trash mr-2"></i>
                                Remove
                              </Button>
                            </div>
                          </div>
                          
                          {opportunityApplications.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg">
                              <i className="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
                              <p className="text-gray-600 text-lg">No applications yet</p>
                              <p className="text-gray-500 text-sm">Students will see this opportunity and can apply</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {/* Pending Applications */}
                              {opportunityApplications.filter(app => app.status === "pending").length > 0 && (
                                <div>
                                  <h5 className="font-medium text-orange-700 mb-3 flex items-center">
                                    <i className="fas fa-clock mr-2"></i>
                                    ⏳ Pending Applications ({opportunityApplications.filter(app => app.status === "pending").length})
                                  </h5>
                                  <div className="grid gap-3">
                                    {opportunityApplications.filter(app => app.status === "pending").map((application) => (
                                      <div key={application.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                              {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                                            </div>
                                            <div>
                                              <p className="font-semibold text-gray-900">
                                                {application.user?.firstName} {application.user?.lastName}
                                              </p>
                                              <p className="text-sm text-gray-600">{application.user?.email}</p>
                                              <p className="text-xs text-gray-500">
                                                Applied: {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd, yyyy 'at' HH:mm") : "Unknown"}
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
                                              data-testid={`button-accept-${application.id}`}
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
                                              data-testid={`button-reject-${application.id}`}
                                            >
                                              ❌ Reject
                                            </Button>
                                            {application.user?.email && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(`mailto:${application.user?.email}`)}
                                                data-testid={`button-email-${application.id}`}
                                              >
                                                <i className="fas fa-envelope text-gray-500"></i>
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Hours to Review */}
                              {opportunityApplications.filter(app => app.status === "hours_submitted").length > 0 && (
                                <div>
                                  <h5 className="font-medium text-purple-700 mb-3 flex items-center">
                                    <i className="fas fa-clock mr-2"></i>
                                    ⏰ Hours Submitted for Review ({opportunityApplications.filter(app => app.status === "hours_submitted").length})
                                  </h5>
                                  <div className="grid gap-3">
                                    {opportunityApplications.filter(app => app.status === "hours_submitted").map((application) => (
                                      <div key={application.id} className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                              {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                                            </div>
                                            <div>
                                              <p className="font-semibold text-gray-900">
                                                {application.user?.firstName} {application.user?.lastName}
                                              </p>
                                              <p className="text-sm text-gray-600">{application.user?.email}</p>
                                              <div className="flex items-center space-x-4 mt-1">
                                                <p className="text-sm font-medium text-purple-700">
                                                  ⏱️ {application.submittedHours || 0} hours completed
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                  💰 {(application.submittedHours || 0) * (opportunity.coinsPerHour || 10)} coins to award
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  Submitted: {application.hourSubmissionDate ? format(new Date(application.hourSubmissionDate), "MMM dd 'at' HH:mm") : "Unknown"}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="flex space-x-2">
                                            <Button
                                              size="sm"
                                              onClick={() => {
                                                const coinsAwarded = (application.submittedHours || 0) * (opportunity.coinsPerHour || 10);
                                                approveHoursMutation.mutate({
                                                  applicationId: application.id,
                                                  coinsAwarded,
                                                });
                                              }}
                                              className="bg-green-600 hover:bg-green-700"
                                              data-testid={`button-approve-hours-${application.id}`}
                                            >
                                              ✅ Approve Hours
                                            </Button>
                                            <Button
                                              variant="destructive"
                                              size="sm"
                                              onClick={() => {
                                                const feedback = prompt("📝 Provide feedback for rejection:");
                                                if (feedback && feedback.trim()) {
                                                  rejectHoursMutation.mutate({
                                                    applicationId: application.id,
                                                    feedback,
                                                  });
                                                }
                                              }}
                                              data-testid={`button-reject-hours-${application.id}`}
                                            >
                                              ❌ Reject Hours
                                            </Button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Accepted - Waiting for Hours */}
                              {opportunityApplications.filter(app => app.status === "accepted").length > 0 && (
                                <div>
                                  <h5 className="font-medium text-blue-700 mb-3 flex items-center">
                                    <i className="fas fa-hourglass-half mr-2"></i>
                                    ⏳ Accepted - Awaiting Hours ({opportunityApplications.filter(app => app.status === "accepted").length})
                                  </h5>
                                  <div className="grid gap-3">
                                    {opportunityApplications.filter(app => app.status === "accepted").map((application) => (
                                      <div key={application.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                              {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                                            </div>
                                            <div>
                                              <p className="font-semibold text-gray-900">
                                                {application.user?.firstName} {application.user?.lastName}
                                              </p>
                                              <p className="text-sm text-gray-600">{application.user?.email}</p>
                                              <p className="text-xs text-blue-600">Student needs to submit their completed hours</p>
                                            </div>
                                          </div>
                                          
                                          <div className="flex space-x-2">
                                            <Badge className="bg-blue-100 text-blue-800">
                                              👍 Waiting for work completion
                                            </Badge>
                                            {application.user?.email && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(`mailto:${application.user?.email}?subject=IIMB Samarpan - ${opportunity.title}&body=Hi ${application.user?.firstName}, just checking in on your progress with ${opportunity.title}. Please submit your hours when you've completed the work.`)}
                                                data-testid={`button-email-${application.id}`}
                                              >
                                                <i className="fas fa-envelope text-gray-500"></i>
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Completed */}
                              {opportunityApplications.filter(app => app.status === "completed" || app.status === "hours_approved").length > 0 && (
                                <div>
                                  <h5 className="font-medium text-green-700 mb-3 flex items-center">
                                    <i className="fas fa-trophy mr-2"></i>
                                    🏆 Completed Work ({opportunityApplications.filter(app => app.status === "completed" || app.status === "hours_approved").length})
                                  </h5>
                                  <div className="grid gap-3">
                                    {opportunityApplications.filter(app => app.status === "completed" || app.status === "hours_approved").map((application) => (
                                      <div key={application.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                              {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                                            </div>
                                            <div>
                                              <p className="font-semibold text-gray-900">
                                                {application.user?.firstName} {application.user?.lastName}
                                              </p>
                                              <p className="text-sm text-gray-600">{application.user?.email}</p>
                                              <div className="flex items-center space-x-4 mt-1">
                                                <p className="text-sm font-medium text-green-700">
                                                  ⏱️ {application.hoursCompleted || application.submittedHours || 0} hours completed
                                                </p>
                                                <p className="text-sm text-green-700">
                                                  💰 {application.coinsAwarded || 0} coins awarded
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <Badge className="bg-green-100 text-green-800">
                                            ✅ Completed
                                          </Badge>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}