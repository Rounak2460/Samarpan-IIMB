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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { OpportunityWithCreator } from "@shared/schema";

export default function AdminOpportunities() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
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

  const { data: opportunitiesData, isLoading } = useQuery({
    queryKey: ["/api/opportunities", {
      search: searchQuery,
      status: statusFilter === "all" ? undefined : [statusFilter],
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }],
    enabled: !!user && user.role === "admin",
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

  const opportunities = opportunitiesData?.opportunities || [];
  const totalOpportunities = opportunitiesData?.total || 0;
  const totalPages = Math.ceil(totalOpportunities / pageSize);

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
      setSelectedOpportunities(opportunities.map(opp => opp.id));
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
              ) : opportunities.length === 0 ? (
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
                            checked={selectedOpportunities.length === opportunities.length}
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
                      {opportunities.map((opportunity: OpportunityWithCreator) => (
                        <tr
                          key={opportunity.id}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          data-testid={`opportunity-row-${opportunity.id}`}
                        >
                          <td className="py-4 pl-4">
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
                            <Badge className={getStatusColor(opportunity.status)}>
                              {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge className={getTypeColor(opportunity.type)}>
                              {opportunity.type.replace("_", " ").toUpperCase()}
                            </Badge>
                          </td>
                          <td className="py-4 font-medium text-foreground">
                            <Link href={`/admin/applications/${opportunity.id}`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-applicants-${opportunity.id}`}>
                                {opportunity._count?.applications || 0}
                              </Button>
                            </Link>
                          </td>
                          <td className="py-4 text-muted-foreground text-sm">
                            {opportunity.createdAt ? format(new Date(opportunity.createdAt), "MMM dd, yyyy") : "Unknown"}
                          </td>
                          <td className="py-4">
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
                              <Link href={`/admin/applications/${opportunity.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`button-view-applications-${opportunity.id}`}
                                >
                                  <i className="fas fa-users"></i>
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
    </div>
  );
}
