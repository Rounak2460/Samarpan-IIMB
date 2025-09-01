import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import type { ApplicationWithDetails, OpportunityWithCreator } from "@shared/schema";

export default function Applications() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithDetails | null>(null);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newHours, setNewHours] = useState<number>(0);
  const [newFeedback, setNewFeedback] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [coinsAwarded, setCoinsAwarded] = useState(1);
  const [approveHoursDialogOpen, setApproveHoursDialogOpen] = useState(false);
  const [rejectHoursDialogOpen, setRejectHoursDialogOpen] = useState(false);
  const [approvalCoins, setApprovalCoins] = useState(1);
  const [rejectionFeedback, setRejectionFeedback] = useState("");

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

  const { data: opportunity, isLoading: opportunityLoading } = useQuery<OpportunityWithCreator>({
    queryKey: ["/api/opportunities", opportunityId],
    enabled: !!user && user.role === "admin",
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ["/api/applications/opportunity", opportunityId],
    enabled: !!user && user.role === "admin",
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: {
      applicationId: string;
      status: string;
      notes?: string;
      coinsAwarded?: number;
      hoursCompleted?: number;
      adminFeedback?: string;
    }) => {
      await apiRequest("PUT", `/api/applications/${data.applicationId}/status`, {
        status: data.status,
        notes: data.notes,
        coinsAwarded: data.coinsAwarded,
        hoursCompleted: data.hoursCompleted,
        adminFeedback: data.adminFeedback,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Application status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/opportunity"] });
      setUpdateDialogOpen(false);
      setSelectedApplication(null);
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
        description: error.message || "Failed to update application status",
        variant: "destructive",
      });
    },
  });

  // Approve hours mutation
  const approveHoursMutation = useMutation({
    mutationFn: async ({ applicationId, coinsAwarded, feedback }: {
      applicationId: string;
      coinsAwarded: number;
      feedback?: string;
    }) => {
      await apiRequest(`/api/applications/${applicationId}/approve-hours`, {
        method: "POST",
        body: { coinsAwarded, feedback },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/opportunity", opportunityId] });
      setApproveHoursDialogOpen(false);
      setApprovalCoins(1);
      setSelectedApplication(null);
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

  // Reject hours mutation
  const rejectHoursMutation = useMutation({
    mutationFn: async ({ applicationId, feedback }: {
      applicationId: string;
      feedback: string;
    }) => {
      await apiRequest(`/api/applications/${applicationId}/reject-hours`, {
        method: "POST",
        body: { feedback },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications/opportunity", opportunityId] });
      setRejectHoursDialogOpen(false);
      setRejectionFeedback("");
      setSelectedApplication(null);
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

  const handleApproveHours = (application: ApplicationWithDetails) => {
    setSelectedApplication(application);
    setApprovalCoins(application.submittedHours * 10); // Default: 10 coins per hour
    setApproveHoursDialogOpen(true);
  };

  const handleRejectHours = (application: ApplicationWithDetails) => {
    setSelectedApplication(application);
    setRejectHoursDialogOpen(true);
  };

  if (authLoading || opportunityLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold text-foreground mb-4">Opportunity Not Found</h1>
            <p className="text-muted-foreground">The opportunity you're looking for doesn't exist.</p>
          </div>
        </main>
      </div>
    );
  }

  const filteredApplications = applications?.filter(app => {
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSearch = !searchQuery || 
      `${app.user?.firstName} ${app.user?.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleUpdateStatus = (application: ApplicationWithDetails) => {
    setSelectedApplication(application);
    setNewStatus(application.status || 'pending');
    setNotes(application.notes || "");
    // Calculate default coins based on hourly rate and max limit
    const defaultCoins = Math.min(
      Math.round((application.hoursCompleted || 1) * (opportunity.coinsPerHour || 10)),
      opportunity.maxCoins || 100
    );
    setCoinsAwarded(application.coinsAwarded || defaultCoins);
    setNewHours(application.hoursCompleted || 0);
    setNewFeedback(application.adminFeedback || "");
    setUpdateDialogOpen(true);
  };

  const handleSubmitUpdate = () => {
    if (!selectedApplication) return;

    updateStatusMutation.mutate({
      applicationId: selectedApplication.id,
      status: newStatus,
      notes: notes,
      coinsAwarded: newStatus === "completed" ? coinsAwarded : undefined,
      hoursCompleted: newStatus === "completed" ? newHours : undefined,
      adminFeedback: newStatus === "completed" ? newFeedback : undefined,
    });
  };

  const exportApplications = () => {
    if (!filteredApplications.length) return;

    const csvContent = [
      ["Name", "Email", "Applied Date", "Status", "Completed Date", "Coins Awarded", "Notes"],
      ...filteredApplications.map(app => [
        `${app.user?.firstName || ""} ${app.user?.lastName || ""}`.trim(),
        app.user?.email || "",
        app.appliedAt ? format(new Date(app.appliedAt), "yyyy-MM-dd") : "",
        app.status,
        app.completedAt ? format(new Date(app.completedAt), "yyyy-MM-dd") : "",
        app.coinsAwarded || "",
        app.notes || "",
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${opportunity.title}-applications.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <p className="text-muted-foreground mt-1">
              Managing applications for "{opportunity.title}"
            </p>
          </div>

          {/* Opportunity Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Opportunity Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Type:</strong> {opportunity.type.replace("_", " ").toUpperCase()}</p>
                    <p><strong>Duration:</strong> {opportunity.customDuration || opportunity.duration}</p>
                    <p><strong>Coins Reward:</strong> {opportunity.coinsPerHour}/hr (max {opportunity.maxCoins})</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Application Stats</h3>
                  <div className="space-y-1 text-sm">
                    <p><strong>Total Applications:</strong> {applications?.length || 0}</p>
                    <p><strong>Pending:</strong> {applications?.filter(a => a.status === "pending").length || 0}</p>
                    <p><strong>Completed:</strong> {applications?.filter(a => a.status === "completed").length || 0}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportApplications}
                      disabled={!filteredApplications.length}
                      data-testid="button-export-applications"
                    >
                      <i className="fas fa-download mr-2"></i>
                      Export CSV
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-applications"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48" data-testid="select-status-filter">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Applications ({filteredApplications.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
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
              ) : filteredApplications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-inbox text-muted-foreground text-xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || statusFilter !== "all" 
                      ? "No applications match your current filters" 
                      : "No students have applied to this opportunity yet"
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="py-3 text-muted-foreground font-medium">Applicant</th>
                        <th className="py-3 text-muted-foreground font-medium">Applied Date</th>
                        <th className="py-3 text-muted-foreground font-medium">Status</th>
                        <th className="py-3 text-muted-foreground font-medium">Coins Awarded</th>
                        <th className="py-3 text-muted-foreground font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((application) => (
                        <tr
                          key={application.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          data-testid={`application-row-${application.id}`}
                        >
                          <td className="py-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                                {application.user?.firstName?.[0]}{application.user?.lastName?.[0]}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {application.user?.firstName} {application.user?.lastName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {application.user?.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-muted-foreground">
                            {application.appliedAt 
                              ? format(new Date(application.appliedAt), "MMM dd, yyyy")
                              : "Unknown"
                            }
                          </td>
                          <td className="py-4">
                            <Badge className={getStatusColor(application.status || 'pending')}>
                              {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4">
                            {(application.coinsAwarded || 0) > 0 ? (
                              <div className="flex items-center space-x-1">
                                <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                                <span className="font-medium">{application.coinsAwarded || 0}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="py-4">
                            <div className="flex items-center space-x-2">
                              {application.status === "hours_submitted" ? (
                                <>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleApproveHours(application)}
                                    data-testid={`button-approve-hours-${application.id}`}
                                  >
                                    <i className="fas fa-check mr-1"></i>
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRejectHours(application)}
                                    data-testid={`button-reject-hours-${application.id}`}
                                  >
                                    <i className="fas fa-times mr-1"></i>
                                    Reject
                                  </Button>
                                  <div className="text-sm text-muted-foreground">
                                    {application.submittedHours} hrs submitted
                                  </div>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(application)}
                                  data-testid={`button-update-status-${application.id}`}
                                >
                                  <i className="fas fa-edit mr-1"></i>
                                  Update
                                </Button>
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
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Update Status Dialog */}
      <Dialog open={updateDialogOpen} onOpenChange={setUpdateDialogOpen}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-update-status">
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedApplication?.user?.firstName} {selectedApplication?.user?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger data-testid="select-new-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newStatus === "completed" && (
              <>
                <div>
                  <Label htmlFor="coins">Coins to Award</Label>
                  <Input
                    id="coins"
                    type="number"
                    min="1"
                    value={coinsAwarded}
                    onChange={(e) => setCoinsAwarded(parseInt(e.target.value) || 1)}
                    data-testid="input-coins-awarded"
                  />
                </div>
                <div>
                  <Label htmlFor="hours">Hours Completed</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={newHours}
                    onChange={(e) => setNewHours(parseFloat(e.target.value) || 0)}
                    data-testid="input-hours-completed"
                    placeholder="Enter hours completed"
                  />
                </div>
                <div>
                  <Label htmlFor="feedback">Admin Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    placeholder="Provide feedback on the student's performance..."
                    rows={3}
                    data-testid="textarea-admin-feedback"
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this application..."
                rows={3}
                data-testid="textarea-notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setUpdateDialogOpen(false)}
              disabled={updateStatusMutation.isPending}
              data-testid="button-cancel-update"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitUpdate}
              disabled={updateStatusMutation.isPending}
              data-testid="button-submit-update"
            >
              {updateStatusMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                "Update Status"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Hours Dialog */}
      <Dialog open={approveHoursDialogOpen} onOpenChange={setApproveHoursDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Hours</DialogTitle>
            <DialogDescription>
              Approve the submitted hours for {selectedApplication?.user?.firstName} {selectedApplication?.user?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Submitted Hours: {selectedApplication?.submittedHours}
              </p>
            </div>
            <div>
              <Label htmlFor="approval-coins">Coins to Award</Label>
              <Input
                id="approval-coins"
                type="number"
                min="1"
                value={approvalCoins}
                onChange={(e) => setApprovalCoins(parseInt(e.target.value) || 1)}
                data-testid="input-approval-coins"
              />
            </div>
            <div>
              <Label htmlFor="approval-feedback">Feedback (Optional)</Label>
              <Textarea
                id="approval-feedback"
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                placeholder="Provide feedback for the student..."
                data-testid="textarea-approval-feedback"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveHoursDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedApplication) {
                  approveHoursMutation.mutate({
                    applicationId: selectedApplication.id,
                    coinsAwarded: approvalCoins,
                    feedback: newFeedback,
                  });
                }
              }}
              disabled={!approvalCoins || approvalCoins <= 0}
              data-testid="button-confirm-approve"
            >
              Approve Hours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Hours Dialog */}
      <Dialog open={rejectHoursDialogOpen} onOpenChange={setRejectHoursDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Hours</DialogTitle>
            <DialogDescription>
              Reject the submitted hours for {selectedApplication?.user?.firstName} {selectedApplication?.user?.lastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Submitted Hours: {selectedApplication?.submittedHours}
              </p>
            </div>
            <div>
              <Label htmlFor="rejection-feedback">Feedback (Required)</Label>
              <Textarea
                id="rejection-feedback"
                value={rejectionFeedback}
                onChange={(e) => setRejectionFeedback(e.target.value)}
                placeholder="Please provide specific feedback on why the hours are being rejected..."
                data-testid="textarea-rejection-feedback"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectHoursDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedApplication) {
                  rejectHoursMutation.mutate({
                    applicationId: selectedApplication.id,
                    feedback: rejectionFeedback,
                  });
                }
              }}
              disabled={!rejectionFeedback.trim()}
              data-testid="button-confirm-reject"
            >
              Reject Hours
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
