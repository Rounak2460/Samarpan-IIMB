import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { OpportunityWithCreator, ApplicationWithDetails } from "@shared/schema";

export default function AdminOpportunities() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOpportunity, setExpandedOpportunity] = useState<string | null>(null);

  const { data: opportunities, isLoading } = useQuery<OpportunityWithCreator[]>({
    queryKey: ["/api/admin/opportunities"],
    enabled: !!user && user.role === "admin",
  });

  const { data: applicants, isLoading: applicantsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: [`/api/applications/opportunity/${expandedOpportunity}`],
    enabled: !!expandedOpportunity,
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
        title: "Success",
        description: "Application status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/opportunity"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  const approveHoursMutation = useMutation({
    mutationFn: async ({ applicationId, coinsAwarded, feedback }: {
      applicationId: string;
      coinsAwarded: number;
      feedback?: string;
    }) => {
      await apiRequest("POST", `/api/applications/${applicationId}/approve-hours`, {
        coinsAwarded,
        feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/opportunity"] });
      toast({
        title: "Success",
        description: "Hours approved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
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
      queryClient.invalidateQueries({ queryKey: ["/api/applications/opportunity"] });
      toast({
        title: "Success",
        description: "Hours rejected with feedback",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reject hours",
        variant: "destructive",
      });
    },
  });

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Opportunities & Applications</h1>
              <p className="text-muted-foreground mt-1">
                Create, edit, and manage volunteering opportunities with integrated application management
              </p>
            </div>
            <Link href="/admin/opportunities/new">
              <Button data-testid="button-new-opportunity">
                <i className="fas fa-plus mr-2"></i>
                New Opportunity
              </Button>
            </Link>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-opportunities"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="filled">Filled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Opportunities List */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : filteredOpportunities.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-clipboard-list text-muted-foreground text-xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Opportunities Found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your filters" 
                      : "Create your first opportunity to get started"
                    }
                  </p>
                  <Link href="/admin/opportunities/new">
                    <Button data-testid="button-create-first-opportunity">
                      <i className="fas fa-plus mr-2"></i>
                      Create Opportunity
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              filteredOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    {/* Opportunity Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{opportunity.title}</h3>
                          <Badge className={getStatusColor(opportunity.status || 'open')}>
                            {opportunity.status || 'open'}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {opportunity.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{opportunity.shortDescription}</p>
                        <p className="text-xs text-muted-foreground">
                          Created: {opportunity.createdAt ? format(new Date(opportunity.createdAt), "MMM dd, yyyy") : "Unknown"}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOpportunityExpansion(opportunity.id)}
                          data-testid={`button-manage-applications-${opportunity.id}`}
                        >
                          <i className={`fas ${expandedOpportunity === opportunity.id ? 'fa-chevron-up' : 'fa-users'} mr-2`}></i>
                          {expandedOpportunity === opportunity.id ? 'Hide' : 'Manage'} Applications
                        </Button>
                        <Link href={`/admin/opportunities/edit/${opportunity.id}`}>
                          <Button variant="ghost" size="sm" data-testid={`button-edit-${opportunity.id}`}>
                            <i className="fas fa-edit"></i>
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Expanded Applications Section */}
                    {expandedOpportunity === opportunity.id && (
                      <div className="border-t pt-4 mt-4">
                        <h4 className="font-semibold mb-3 flex items-center">
                          <i className="fas fa-users mr-2"></i>
                          Applications for {opportunity.title}
                        </h4>
                        
                        {applicantsLoading ? (
                          <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                              <Skeleton key={i} className="h-16 w-full" />
                            ))}
                          </div>
                        ) : !applicants || applicants.length === 0 ? (
                          <div className="text-center py-8 bg-gray-50 rounded-lg">
                            <i className="fas fa-inbox text-gray-400 text-2xl mb-2"></i>
                            <p className="text-gray-500">No applications yet</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {applicants.map((application) => (
                              <div key={application.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                                    {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {application.user?.firstName} {application.user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500">{application.user?.email}</p>
                                    <p className="text-xs text-gray-400">
                                      Applied: {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd, yyyy") : "Unknown"}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                  <Badge className={getStatusColor(application.status || 'pending')} data-testid={`badge-status-${application.id}`}>
                                    {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1).replace('_', ' ')}
                                  </Badge>
                                  
                                  {application.status === "hours_submitted" ? (
                                    <>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          approveHoursMutation.mutate({
                                            applicationId: application.id,
                                            coinsAwarded: (application.submittedHours || 0) * (opportunity.coinsPerHour || 10),
                                            feedback: "Hours approved by admin",
                                          });
                                        }}
                                        data-testid={`button-approve-hours-${application.id}`}
                                      >
                                        <i className="fas fa-check mr-1"></i>
                                        Approve ({application.submittedHours || 0}h)
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                          const feedback = prompt("Please provide feedback for rejection:");
                                          if (feedback) {
                                            rejectHoursMutation.mutate({
                                              applicationId: application.id,
                                              feedback,
                                            });
                                          }
                                        }}
                                        data-testid={`button-reject-hours-${application.id}`}
                                      >
                                        <i className="fas fa-times mr-1"></i>
                                        Reject
                                      </Button>
                                    </>
                                  ) : application.status === "pending" ? (
                                    <>
                                      <Button
                                        variant="default"
                                        size="sm"
                                        onClick={() => {
                                          updateStatusMutation.mutate({
                                            applicationId: application.id,
                                            status: "accepted",
                                            notes: "Application accepted by admin",
                                          });
                                        }}
                                        data-testid={`button-accept-${application.id}`}
                                      >
                                        <i className="fas fa-check mr-1"></i>
                                        Accept
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
                                        <i className="fas fa-times mr-1"></i>
                                        Reject
                                      </Button>
                                    </>
                                  ) : (
                                    <span className="text-xs text-gray-500">
                                      {application.status === "accepted" && "Awaiting hour submission"}
                                      {application.status === "completed" && `Completed - ${application.coinsAwarded || 0} coins awarded`}
                                    </span>
                                  )}
                                  
                                  {application.user?.email && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => window.open(`mailto:${application.user?.email}`)}
                                      data-testid={`button-email-${application.id}`}
                                    >
                                      <i className="fas fa-envelope"></i>
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}