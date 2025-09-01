import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import ApplicationModal from "@/components/application-modal";
import { useState } from "react";
import type { OpportunityWithCreator } from "@shared/schema";

export default function OpportunityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showApplicationModal, setShowApplicationModal] = useState(false);

  const { data: opportunity, isLoading } = useQuery<OpportunityWithCreator>({
    queryKey: [`/api/opportunities/${id}`],
  });

  const { data: userApplications } = useQuery<any[]>({
    queryKey: [`/api/applications/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/applications`, {
        opportunityId: id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setShowApplicationModal(false);
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
        title: "Application Failed",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-64 w-full" />
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-48 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
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

  const hasApplied = Array.isArray(userApplications) && userApplications.some((app: any) => app.opportunityId === id);
  const canApply = isAuthenticated && opportunity.status === "open" && !hasApplied && user?.role !== "admin";

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-opportunity-title">
                  {opportunity.title}
                </h1>
                <p className="text-muted-foreground">
                  Created by {opportunity.creator?.firstName} {opportunity.creator?.lastName}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={getStatusColor(opportunity.status || 'open')} data-testid="badge-status">
                  {(opportunity.status || 'open').charAt(0).toUpperCase() + (opportunity.status || 'open').slice(1)}
                </Badge>
                <Button variant="outline" size="sm" data-testid="button-share">
                  <i className="fas fa-share mr-1"></i>Share
                </Button>
              </div>
            </div>

            {/* Image */}
            {opportunity.imageUrl && (
              <div className="w-full h-64 bg-muted rounded-lg overflow-hidden mb-6">
                <img
                  src={opportunity.imageUrl}
                  alt={opportunity.title}
                  className="w-full h-full object-cover"
                  data-testid="img-opportunity"
                />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap" data-testid="text-description">
                    {opportunity.fullDescription}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <p className="text-foreground font-medium" data-testid="text-duration">
                        {opportunity.customDuration || opportunity.duration}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <div className="mt-1">
                        <Badge className={getTypeColor(opportunity.type)} data-testid="badge-type">
                          {opportunity.type.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {opportunity.location && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <p className="text-foreground flex items-center">
                        <i className="fas fa-map-marker-alt mr-2 text-muted-foreground"></i>
                        {opportunity.location}
                      </p>
                    </div>
                  )}

                  {opportunity.schedule && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Schedule</label>
                      <p className="text-foreground flex items-center">
                        <i className="fas fa-clock mr-2 text-muted-foreground"></i>
                        {opportunity.schedule}
                      </p>
                    </div>
                  )}

                  {opportunity.skills && opportunity.skills.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Required Skills</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {opportunity.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" data-testid={`badge-skill-${index}`}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {opportunity.capacity && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Capacity</label>
                      <p className="text-foreground">
                        {opportunity._count?.applications || 0} / {opportunity.capacity} applicants
                      </p>
                    </div>
                  )}

                  <Separator />

                  {(opportunity.contactEmail || opportunity.contactPhone) && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contact Information</label>
                      <div className="space-y-1 mt-1">
                        {opportunity.contactEmail && (
                          <p className="text-foreground flex items-center">
                            <i className="fas fa-envelope mr-2 text-muted-foreground"></i>
                            {opportunity.contactEmail}
                          </p>
                        )}
                        {opportunity.contactPhone && (
                          <p className="text-foreground flex items-center">
                            <i className="fas fa-phone mr-2 text-muted-foreground"></i>
                            {opportunity.contactPhone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Apply Card */}
            <div className="md:col-span-1">
              <Card className="sticky top-8">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 text-2xl font-bold text-primary">
                      <div className="coin-icon">₹</div>
                      <span data-testid="text-coins-reward">{opportunity.coinsPerHour}/hr (max {opportunity.maxCoins})</span>
                      <span className="text-sm text-muted-foreground font-normal">coins reward</span>
                    </div>

                    {hasApplied ? (
                      <div className="space-y-2">
                        <Badge className="bg-green-100 text-green-800 w-full py-2" data-testid="badge-applied">
                          <i className="fas fa-check mr-2"></i>
                          Applied
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          You have already applied to this opportunity
                        </p>
                      </div>
                    ) : canApply ? (
                      <div className="space-y-2">
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => setShowApplicationModal(true)}
                          disabled={applyMutation.isPending}
                          data-testid="button-apply"
                        >
                          {applyMutation.isPending ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              Applying...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-paper-plane mr-2"></i>
                              Apply Now
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          You'll receive a confirmation email after applying
                        </p>
                      </div>
                    ) : !isAuthenticated ? (
                      <div className="space-y-2">
                        <Button
                          size="lg"
                          className="w-full"
                          onClick={() => window.location.href = '/api/login'}
                          data-testid="button-login-to-apply"
                        >
                          <i className="fas fa-sign-in-alt mr-2"></i>
                          Login to Apply
                        </Button>
                      </div>
                    ) : opportunity.status === "closed" ? (
                      <div className="space-y-2">
                        <Button size="lg" className="w-full" disabled data-testid="button-closed">
                          <i className="fas fa-lock mr-2"></i>
                          Applications Closed
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button size="lg" className="w-full" disabled data-testid="button-unavailable">
                          Not Available
                        </Button>
                      </div>
                    )}

                    <div className="text-sm text-muted-foreground">
                      <p>
                        <i className="fas fa-users mr-1"></i>
                        {opportunity._count?.applications || 0} students applied
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Application Modal */}
      <ApplicationModal
        opportunity={opportunity}
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        onSubmit={() => applyMutation.mutate()}
        isSubmitting={applyMutation.isPending}
      />

      <Footer />
    </div>
  );
}
