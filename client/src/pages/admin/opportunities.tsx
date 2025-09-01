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

  // Close opportunity mutation
  const closeOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return await apiRequest("PATCH", `/api/opportunities/${opportunityId}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/opportunities"] });
      toast({
        title: "Success",
        description: "Opportunity closed successfully",
      });
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
        description: "Failed to close opportunity",
        variant: "destructive",
      });
    },
  });

  // Delete opportunity mutation
  const deleteOpportunityMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      return await apiRequest("DELETE", `/api/opportunities/${opportunityId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/opportunities"] });
      toast({
        title: "Success",
        description: "Opportunity removed successfully",
      });
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
        description: "Failed to remove opportunity",
        variant: "destructive",
      });
    },
  });

  // Student hour approval mutation
  const approveHoursMutation = useMutation({
    mutationFn: async ({ applicationId, coinsAwarded, feedback }: {
      applicationId: string;
      coinsAwarded: number;
      feedback?: string;
    }) => {
      return await apiRequest("POST", `/api/applications/${applicationId}/approve-hours`, {
        coinsAwarded,
        feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/opportunity/${selectedOpportunityId}`] });
      setApplicantAction(null);
      setHoursCompleted("");
      setAdminFeedback("");
      toast({
        title: "Success",
        description: "Hours approved successfully",
      });
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
        description: "Failed to approve hours",
        variant: "destructive",
      });
    },
  });

  // Student hour rejection mutation
  const rejectHoursMutation = useMutation({
    mutationFn: async ({ applicationId, feedback }: {
      applicationId: string;
      feedback: string;
    }) => {
      return await apiRequest("POST", `/api/applications/${applicationId}/reject-hours`, {
        feedback,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/opportunity/${selectedOpportunityId}`] });
      setApplicantAction(null);
      setAdminFeedback("");
      toast({
        title: "Success",
        description: "Hours rejected successfully",
      });
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
        description: "Failed to reject hours",
        variant: "destructive",
      });
    },
  });

  // Bulk action handler
  const handleBulkAction = async (action: string) => {
    if (selectedOpportunities.length === 0) return;

    if (action === "close") {
      for (const oppId of selectedOpportunities) {
        closeOpportunityMutation.mutate(oppId);
      }
      setSelectedOpportunities([]);
    } else if (action === "delete") {
      for (const oppId of selectedOpportunities) {
        deleteOpportunityMutation.mutate(oppId);
      }
      setSelectedOpportunities([]);
    }
  };

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
    queryKey: [`/api/applications/opportunity/${selectedOpportunityId}`],
    enabled: !!selectedOpportunityId,
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
    const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((opportunity as any).description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || opportunity.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOpportunities = filteredOpportunities.length;
  const totalPages = Math.ceil(totalOpportunities / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedOpportunities = filteredOpportunities.slice(startIndex, startIndex + pageSize);

  const handleSelectOpportunity = (opportunityId: string, checked: boolean) => {
    if (checked) {
      setSelectedOpportunities([...selectedOpportunities, opportunityId]);
    } else {
      setSelectedOpportunities(selectedOpportunities.filter(id => id !== opportunityId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOpportunities(paginatedOpportunities.map(opp => opp.id));
    } else {
      setSelectedOpportunities([]);
    }
  };

  const handleApplicantAction = (applicationId: string, action: 'approve' | 'reject') => {
    setApplicantAction({ id: applicationId, action });
  };

  const handleApproveHours = () => {
    if (!applicantAction || !hoursCompleted) return;

    const coinsAwarded = parseInt(hoursCompleted) * 10; // 10 coins per hour
    approveHoursMutation.mutate({
      applicationId: applicantAction.id,
      coinsAwarded,
      feedback: adminFeedback,
    });
  };

  const handleRejectHours = () => {
    if (!applicantAction || !adminFeedback) return;

    rejectHoursMutation.mutate({
      applicationId: applicantAction.id,
      feedback: adminFeedback,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-red-100 text-red-800";
      case "filled": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getApplicationStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "hours_submitted": return "bg-purple-100 text-purple-800";
      case "hours_approved": return "bg-green-100 text-green-800";
      case "hours_rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

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
                <>
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
                        {paginatedOpportunities.map((opportunity) => (
                          <tr
                            key={opportunity.id}
                            className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          >
                            <td className="py-4 pl-4">
                              <Checkbox
                                checked={selectedOpportunities.includes(opportunity.id)}
                                onCheckedChange={(checked) => handleSelectOpportunity(opportunity.id, checked as boolean)}
                                data-testid={`checkbox-opportunity-${opportunity.id}`}
                              />
                            </td>
                            <td className="py-4">
                              <div className="max-w-xs">
                                <p className="font-medium text-foreground truncate">{opportunity.title}</p>
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {(opportunity as any).description || "No description available"}
                                </p>
                              </div>
                            </td>
                            <td className="py-4">
                              <Badge className={getStatusColor(opportunity.status || 'open')}>
                                {opportunity.status || 'open'}
                              </Badge>
                            </td>
                            <td className="py-4">
                              <span className="text-sm text-muted-foreground capitalize">
                                {opportunity.type}
                              </span>
                            </td>
                            <td className="py-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOpportunityId(opportunity.id)}
                                data-testid={`button-view-applicants-${opportunity.id}`}
                              >
                                <i className="fas fa-users mr-2"></i>
                                View Applicants
                              </Button>
                            </td>
                            <td className="py-4">
                              <span className="text-sm text-muted-foreground">
                                {opportunity.createdAt ? format(new Date(opportunity.createdAt), "MMM dd, yyyy") : "Unknown"}
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center space-x-2">
                                <Link href={`/admin/opportunities/edit/${opportunity.id}`}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-testid={`button-edit-${opportunity.id}`}
                                  >
                                    <i className="fas fa-edit"></i>
                                  </Button>
                                </Link>
                                
                                {opportunity.status === "open" && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => closeOpportunityMutation.mutate(opportunity.id)}
                                    data-testid={`button-close-${opportunity.id}`}
                                  >
                                    <i className="fas fa-times text-orange-600"></i>
                                  </Button>
                                )}

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      data-testid={`button-delete-${opportunity.id}`}
                                    >
                                      <i className="fas fa-trash text-red-600"></i>
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(startIndex + pageSize, totalOpportunities)} of {totalOpportunities} opportunities
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          data-testid="button-previous-page"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          data-testid="button-next-page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Applicants Dialog */}
      <Dialog open={!!selectedOpportunityId} onOpenChange={() => setSelectedOpportunityId(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applicants</DialogTitle>
            <DialogDescription>
              Review and manage applicants for this opportunity
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {applicantsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="w-20 h-6" />
                    <Skeleton className="w-24 h-8" />
                  </div>
                ))}
              </div>
            ) : !applicants || applicants.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-users text-muted-foreground text-4xl mb-4"></i>
                <h3 className="text-lg font-medium mb-2">No Applicants</h3>
                <p className="text-muted-foreground">No students have applied for this opportunity yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicants.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <i className="fas fa-user text-muted-foreground"></i>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {application.user?.firstName} {application.user?.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Applied {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd, yyyy") : "Unknown"}
                        </p>
                        {application.status === "hours_submitted" && (
                          <p className="text-sm text-purple-600 font-medium">
                            Submitted {application.submittedHours} hours
                          </p>
                        )}
                        {application.adminFeedback && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Admin feedback: {application.adminFeedback}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge className={getApplicationStatusColor(application.status || 'pending')}>
                        {(application.status || 'pending').replace('_', ' ')}
                      </Badge>
                      {application.status === "hours_submitted" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleApplicantAction(application.id, "approve")}
                            data-testid={`button-approve-hours-${application.id}`}
                          >
                            Approve Hours
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApplicantAction(application.id, "reject")}
                            data-testid={`button-reject-hours-${application.id}`}
                          >
                            Reject Hours
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Hours Dialog */}
      <Dialog open={!!applicantAction} onOpenChange={() => setApplicantAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {applicantAction?.action === "approve" ? "Approve Hours" : "Reject Hours"}
            </DialogTitle>
            <DialogDescription>
              {applicantAction?.action === "approve" 
                ? "Review and approve the submitted hours" 
                : "Provide feedback for rejecting the submitted hours"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {applicantAction?.action === "approve" && (
              <div>
                <Label htmlFor="hours">Hours Completed</Label>
                <Input
                  id="hours"
                  type="number"
                  value={hoursCompleted}
                  onChange={(e) => setHoursCompleted(e.target.value)}
                  placeholder="Enter completed hours"
                  data-testid="input-hours-completed"
                />
              </div>
            )}
            <div>
              <Label htmlFor="feedback">
                {applicantAction?.action === "approve" ? "Feedback (Optional)" : "Feedback (Required)"}
              </Label>
              <Textarea
                id="feedback"
                value={adminFeedback}
                onChange={(e) => setAdminFeedback(e.target.value)}
                placeholder="Enter your feedback..."
                data-testid="textarea-admin-feedback"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setApplicantAction(null)}>
              Cancel
            </Button>
            <Button
              onClick={applicantAction?.action === "approve" ? handleApproveHours : handleRejectHours}
              disabled={applicantAction?.action === "approve" ? !hoursCompleted : !adminFeedback}
              data-testid={`button-confirm-${applicantAction?.action}`}
            >
              {applicantAction?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}