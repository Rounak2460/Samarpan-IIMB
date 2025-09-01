import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { format } from "date-fns";

interface DashboardApplication {
  id: string;
  status: "pending" | "accepted" | "hours_submitted" | "hours_approved" | "completed" | "rejected";
  appliedAt: string;
  completedAt?: string;
  coinsAwarded: number;
  hoursCompleted: number;
  submittedHours: number;
  hourSubmissionDate?: string;
  adminFeedback?: string;
  opportunity: {
    id: string;
    title: string;
    shortDescription: string;
    type: string;
    coinsPerHour: number;
    maxCoins: number;
    imageUrl?: string;
  };
}

export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedApplication, setSelectedApplication] = useState<DashboardApplication | null>(null);
  const [submittedHours, setSubmittedHours] = useState("");

  const { data: applications, isLoading } = useQuery<DashboardApplication[]>({
    queryKey: [`/api/applications/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: userStats } = useQuery<{
    totalApplications: number;
    completedApplications: number;
    totalHours: number;
    totalCoins: number;
    averageRating?: number;
  }>({
    queryKey: [`/api/users/${user?.id}/stats`],
    enabled: !!user?.id,
  });

  const submitHoursMutation = useMutation({
    mutationFn: async ({ applicationId, hours }: { applicationId: string; hours: number }) => {
      await apiRequest("POST", `/api/applications/${applicationId}/submit-hours`, { hours });
    },
    onSuccess: () => {
      toast({
        title: "Hours Submitted",
        description: "Your hours have been submitted for admin review.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/user/${user?.id}`] });
      setSelectedApplication(null);
      setSubmittedHours("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit hours. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitHours = () => {
    if (!selectedApplication || !submittedHours) return;
    
    const hours = parseInt(submittedHours);
    if (isNaN(hours) || hours <= 0) {
      toast({
        title: "Invalid Hours",
        description: "Please enter a valid number of hours.",
        variant: "destructive",
      });
      return;
    }

    submitHoursMutation.mutate({
      applicationId: selectedApplication.id,
      hours,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please log in to view your dashboard</h1>
            <Button onClick={() => window.location.href = '/api/login'}>
              Login
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "hours_submitted": return "bg-purple-100 text-purple-800";
      case "hours_approved": return "bg-indigo-100 text-indigo-800";
      case "completed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-dashboard-title">
              My Volunteer Dashboard
            </h1>
            <p className="text-muted-foreground">
              Track your social impact journey and achievements
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-primary mb-1" data-testid="text-total-applications">
                  {userStats?.totalApplications || 0}
                </div>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1" data-testid="text-completed-applications">
                  {userStats?.completedApplications || 0}
                </div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1" data-testid="text-total-hours">
                  {userStats?.totalHours || 0}h
                </div>
                <p className="text-sm text-muted-foreground">Hours Contributed</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center space-x-2 text-2xl font-bold text-primary mb-1">
                  <div className="coin-icon">₹</div>
                  <span data-testid="text-total-coins">{user?.coins || 0}</span>
                </div>
                <p className="text-sm text-muted-foreground">Coins Earned</p>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          {userStats && userStats.totalApplications > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Progress Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Completion Rate</span>
                      <span>{Math.round((userStats.completedApplications / userStats.totalApplications) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(userStats.completedApplications / userStats.totalApplications) * 100}
                      className="h-2"
                      data-testid="progress-completion"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Applications List */}
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex space-x-4">
                      <Skeleton className="h-16 w-16 rounded" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !applications || applications.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-hands-helping text-4xl text-muted-foreground mb-4"></i>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Applications Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start your volunteer journey by applying to opportunities
                  </p>
                  <Link href="/">
                    <Button data-testid="button-browse-opportunities">
                      <i className="fas fa-search mr-2"></i>
                      Browse Opportunities
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      data-testid={`card-application-${application.id}`}
                    >
                      <div className="flex space-x-4">
                        {/* Image */}
                        <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {application.opportunity.imageUrl ? (
                            <img
                              src={application.opportunity.imageUrl}
                              alt={application.opportunity.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <i className="fas fa-hands-helping text-muted-foreground"></i>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1 min-w-0">
                              <Link href={`/opportunity/${application.opportunity.id}`}>
                                <h3 className="font-medium text-foreground hover:text-primary cursor-pointer truncate" data-testid="text-opportunity-title">
                                  {application.opportunity.title}
                                </h3>
                              </Link>
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {application.opportunity.shortDescription}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(application.status)} data-testid="badge-application-status">
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
                              </Badge>
                              {application.status === "accepted" && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setSelectedApplication(application)}
                                      data-testid="button-submit-hours"
                                    >
                                      Submit Hours
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                      <DialogTitle>Submit Hours</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="font-medium">{application.opportunity.title}</h4>
                                        <p className="text-sm text-muted-foreground">
                                          {application.opportunity.shortDescription}
                                        </p>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="hours">Hours Completed</Label>
                                        <Input
                                          id="hours"
                                          type="number"
                                          placeholder="Enter hours completed"
                                          value={submittedHours}
                                          onChange={(e) => setSubmittedHours(e.target.value)}
                                          data-testid="input-submitted-hours"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Rate: {application.opportunity.coinsPerHour} coins/hour (max {application.opportunity.maxCoins} coins)
                                        </p>
                                      </div>
                                      <div className="flex justify-end space-x-2">
                                        <Button 
                                          variant="outline" 
                                          onClick={() => {
                                            setSelectedApplication(null);
                                            setSubmittedHours("");
                                          }}
                                        >
                                          Cancel
                                        </Button>
                                        <Button 
                                          onClick={handleSubmitHours}
                                          disabled={submitHoursMutation.isPending}
                                          data-testid="button-confirm-submit-hours"
                                        >
                                          {submitHoursMutation.isPending ? "Submitting..." : "Submit Hours"}
                                        </Button>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                            <span>
                              Applied: {format(new Date(application.appliedAt), "MMM dd, yyyy")}
                            </span>
                            {application.completedAt && (
                              <span>
                                Completed: {format(new Date(application.completedAt), "MMM dd, yyyy")}
                              </span>
                            )}
                            {application.hourSubmissionDate && (
                              <span>
                                Hours Submitted: {format(new Date(application.hourSubmissionDate), "MMM dd, yyyy")}
                              </span>
                            )}
                          </div>

                          {/* Progress Details */}
                          <div className="grid md:grid-cols-3 gap-4 mt-3">
                            <div className="text-center p-3 bg-muted/50 rounded">
                              <div className="text-lg font-medium text-foreground" data-testid="text-hours-completed">
                                {application.hoursCompleted || 0}h
                              </div>
                              <div className="text-xs text-muted-foreground">Hours Completed</div>
                              {application.submittedHours > 0 && application.status === "hours_submitted" && (
                                <div className="text-xs text-purple-600 mt-1">
                                  {application.submittedHours}h submitted (pending review)
                                </div>
                              )}
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded">
                              <div className="flex items-center justify-center space-x-1 text-lg font-medium text-primary">
                                <div className="coin-icon" style={{ fontSize: "14px" }}>₹</div>
                                <span data-testid="text-coins-earned">{application.coinsAwarded || 0}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Coins Earned</div>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded">
                              <div className="flex items-center justify-center space-x-1 text-lg font-medium text-primary">
                                <div className="coin-icon" style={{ fontSize: "14px" }}>₹</div>
                                <span>{application.opportunity.coinsPerHour}/hr (max {application.opportunity.maxCoins})</span>
                              </div>
                              <div className="text-xs text-muted-foreground">Potential Reward</div>
                            </div>
                          </div>

                          {/* Admin Feedback */}
                          {application.adminFeedback && (
                            <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r">
                              <div className="flex items-start space-x-2">
                                <i className="fas fa-comment text-blue-500 mt-0.5"></i>
                                <div>
                                  <p className="text-sm font-medium text-blue-900">Admin Feedback</p>
                                  <p className="text-sm text-blue-800" data-testid="text-admin-feedback">
                                    {application.adminFeedback}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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