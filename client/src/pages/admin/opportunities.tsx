import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import type { OpportunityWithCreator, ApplicationWithDetails } from "@shared/schema";

export default function AdminOpportunities() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string | null>(null);
  const [applicantAction, setApplicantAction] = useState<{id: string; action: 'approve' | 'reject'} | null>(null);
  const [hoursCompleted, setHoursCompleted] = useState("");
  const [adminFeedback, setAdminFeedback] = useState("");
  const pageSize = 10;

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

  const { data: opportunities, isLoading } = useQuery<OpportunityWithCreator[]>({
    queryKey: ["/api/admin/opportunities"],
    enabled: !!user && user.role === "admin",
  });

  const { data: applicants, isLoading: applicantsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ["/api/applications/opportunity", selectedOpportunityId],
    enabled: !!selectedOpportunityId,
  });

  const deleteOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      await apiRequest("DELETE", `/api/opportunities/${opportunityId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Opportunity deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setSelectedOpportunities([]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete opportunity",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PUT", `/api/opportunities/${id}`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Opportunity status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setSelectedOpportunities([]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity status",
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async ({ applicationId, status, hoursCompleted, adminFeedback }: {
      applicationId: string;
      status: string;
      hoursCompleted?: number;
      adminFeedback?: string;
    }) => {
      const body: any = { status };
      if (hoursCompleted !== undefined) body.hoursCompleted = hoursCompleted;
      if (adminFeedback) body.adminFeedback = adminFeedback;
      await apiRequest("PUT", `/api/applications/${applicationId}/status`, body);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/opportunities"] });
      setApplicantAction(null);
      setHoursCompleted("");
      setAdminFeedback("");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
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

  // Filter opportunities based on search and status
  const filteredOpportunities = opportunities?.filter(opp => {
    const matchesSearch = !searchQuery || opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         opp.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || opp.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];
  
  // Pagination for filtered opportunities
  const totalOpportunities = filteredOpportunities.length;
  const totalPages = Math.ceil(totalOpportunities / pageSize);
  const paginatedOpportunities = filteredOpportunities.slice(
    (currentPage - 1) * pageSize, 
    currentPage * pageSize
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-red-100 text-red-800";
      case "filled": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "teaching": return "bg-primary/10 text-primary";
      case "donation": return "bg-chart-1/10 text-chart-1";
      case "mentoring": return "bg-chart-2/10 text-chart-2";
      case "community_service": return "bg-chart-3/10 text-chart-3";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOpportunities(paginatedOpportunities.map(opp => opp.id));
    } else {
      setSelectedOpportunities([]);
    }
  };

  const handleSelectOpportunity = (opportunityId: string, checked: boolean) => {
    if (checked) {
      setSelectedOpportunities([...selectedOpportunities, opportunityId]);
    } else {
      setSelectedOpportunities(selectedOpportunities.filter(id => id !== opportunityId));
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOpportunities.length === 0) return;

    try {
      if (action === "close") {
        for (const id of selectedOpportunities) {
          await updateStatusMutation.mutateAsync({ id, status: "closed" });
        }
      } else if (action === "delete") {
        for (const id of selectedOpportunities) {
          await deleteOpportunityMutation.mutateAsync(id);
        }
      }
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  const handleApplicantAction = (applicationId: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      setApplicantAction({ id: applicationId, action });
    } else {
      updateApplicationMutation.mutate({
        applicationId,
        status: 'rejected'
      });
    }
  };

  const handleApproveWithDetails = () => {
    if (!applicantAction) return;
    
    updateApplicationMutation.mutate({
      applicationId: applicantAction.id,
      status: 'completed',
      hoursCompleted: hoursCompleted ? parseFloat(hoursCompleted) : undefined,
      adminFeedback: adminFeedback || undefined
    });
  };

  const selectedOpportunity = opportunities?.find(opp => opp.id === selectedOpportunityId);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manage Opportunities</h1>
              <p className="text-muted-foreground mt-1">
                Create, edit, and manage volunteering opportunities
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
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4 flex-1">
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

                {selectedOpportunities.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Select onValueChange={handleBulkAction}>
                      <SelectTrigger className="w-40" data-testid="select-bulk-actions">
                        <SelectValue placeholder="Bulk Actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="close">Close Selected</SelectItem>
                        <SelectItem value="delete">Delete Selected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" data-testid="badge-selected-count">
                      {selectedOpportunities.length} selected
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opportunities Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Opportunities ({totalOpportunities})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-4 h-4" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="w-20 h-6" />
                      <Skeleton className="w-24 h-8" />
                    </div>
                  ))}
                </div>
              ) : (opportunities || []).length === 0 ? (
                <div className="text-center py-8">
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
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="py-3 pl-4">
                          <Checkbox
                            checked={selectedOpportunities.length === paginatedOpportunities.length && paginatedOpportunities.length > 0}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                            data-testid="checkbox-select-all"
                          />
                        </th>
                        <th className="py-3 text-muted-foreground font-medium">Title</th>
                        <th className="py-3 text-muted-foreground font-medium">Status</th>
                        <th className="py-3 text-muted-foreground font-medium">Type</th>
                        <th className="py-3 text-muted-foreground font-medium">Applicants</th>
                        <th className="py-3 text-muted-foreground font-medium">Created</th>
                        <th className="py-3 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOpportunities.map((opportunity: OpportunityWithCreator) => (
                        <tr
                          key={opportunity.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                          data-testid={`opportunity-row-${opportunity.id}`}
                          onClick={() => setSelectedOpportunityId(opportunity.id)}
                        >
                          <td className="py-4 pl-4" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedOpportunities.includes(opportunity.id)}
                              onCheckedChange={(checked) => 
                                handleSelectOpportunity(opportunity.id, checked as boolean)
                              }
                              data-testid={`checkbox-select-${opportunity.id}`}
                            />
                          </td>
                          <td className="py-4 pr-4">
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">
                                {opportunity.title}
                              </p>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {opportunity.shortDescription}
                              </p>
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge className={getStatusColor(opportunity.status || 'open')}>
                              {(opportunity.status || 'open').charAt(0).toUpperCase() + (opportunity.status || 'open').slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge className={getTypeColor(opportunity.type)}>
                              {opportunity.type.replace("_", " ").toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-4 font-medium text-foreground">
                            <Badge variant="outline" data-testid={`badge-applicants-${opportunity.id}`}>
                              {opportunity._count?.applications || 0} applicants
                            </Badge>
                          </td>
                          <td className="py-4 text-muted-foreground text-sm">
                            {opportunity.createdAt ? format(new Date(opportunity.createdAt), "MMM dd, yyyy") : "Unknown"}
                          </td>
                          <td className="py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center space-x-2">
                              <Link href={`/admin/opportunities/${opportunity.id}/edit`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-edit-${opportunity.id}`}
                                >
                                  <i className="fas fa-edit"></i>
                                </Button>
                              </Link>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-delete-${opportunity.id}`}
                                  >
                                    <i className="fas fa-trash text-destructive"></i>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Opportunity</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{opportunity.title}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteOpportunityMutation.mutate(opportunity.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    data-testid="button-prev-page"
                  >
                    <i className="fas fa-chevron-left mr-1"></i>Previous
                  </Button>
                  
                  <div className="flex space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    data-testid="button-next-page"
                  >
                    Next<i className="fas fa-chevron-right ml-1"></i>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Applicant Management Modal */}
      <Dialog open={!!selectedOpportunityId} onOpenChange={() => setSelectedOpportunityId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Applicants - {selectedOpportunity?.title}</DialogTitle>
            <DialogDescription>
              Review and manage applications for this opportunity
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {applicantsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : applicants && applicants.length > 0 ? (
              applicants.map((application) => (
                <div key={application.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-foreground">
                        {application.user.firstName} {application.user.lastName}
                      </p>
                      <Badge className={
                        application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        application.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{application.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Applied: {format(new Date(application.appliedAt!), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                    {application.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Completed: {format(new Date(application.completedAt!), "MMM dd, yyyy 'at' h:mm a")}
                      </p>
                    )}
                    {application.hoursCompleted && (
                      <p className="text-xs text-green-600">
                        Hours: {application.hoursCompleted} | Coins: {application.coinsAwarded || 0}
                      </p>
                    )}
                    {application.adminFeedback && (
                      <p className="text-xs text-blue-600">
                        Feedback: {application.adminFeedback}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {(application.status || 'pending') === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleApplicantAction(application.id, 'reject')}
                          data-testid={`button-reject-${application.id}`}
                        >
                          <i className="fas fa-times mr-1"></i>
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApplicantAction(application.id, 'approve')}
                          data-testid={`button-approve-${application.id}`}
                        >
                          <i className="fas fa-check mr-1"></i>
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-users text-muted-foreground text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No Applications</h3>
                <p className="text-muted-foreground">
                  No students have applied for this opportunity yet.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve with Hours/Feedback Dialog */}
      <Dialog open={!!applicantAction} onOpenChange={() => setApplicantAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>
              Set hours completed and provide feedback for this volunteer work
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="hours">Hours Completed</Label>
              <Input
                id="hours"
                type="number"
                placeholder="Enter hours completed"
                value={hoursCompleted}
                onChange={(e) => setHoursCompleted(e.target.value)}
                data-testid="input-hours-completed"
              />
            </div>
            
            <div>
              <Label htmlFor="feedback">Admin Feedback</Label>
              <Textarea
                id="feedback"
                placeholder="Provide feedback on the volunteer's work"
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                rows={3}
                data-testid="textarea-admin-feedback"
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setApplicantAction(null)}
              data-testid="button-cancel-approval"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveWithDetails}
              disabled={updateApplicationMutation.isPending}
              data-testid="button-confirm-approval"
            >
              {updateApplicationMutation.isPending ? "Approving..." : "Approve & Complete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
