import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import type { Opportunity, ApplicationWithDetails } from "@shared/schema";

export default function StudentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [submittedHours, setSubmittedHours] = useState("");

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useQuery<{
    opportunities: Opportunity[];
  }>({
    queryKey: ["/api/opportunities"],
    enabled: !!user,
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: [`/api/applications/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const submitHoursMutation = useMutation({
    mutationFn: async (data: { applicationId: string; hours: number }) => {
      await apiRequest("PATCH", `/api/applications/${data.applicationId}/submit-hours`, {
        hours: data.hours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/user/${user?.id}`] });
      setSelectedApplication(null);
      setSubmittedHours("");
      toast({
        title: "🎉 Hours Submitted!",
        description: "Your hours have been submitted for admin review",
      });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to submit hours",
        variant: "destructive",
      });
    },
  });

  const applyMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      await apiRequest("POST", "/api/applications", { opportunityId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      queryClient.invalidateQueries({ queryKey: [`/api/applications/user/${user?.id}`] });
      toast({
        title: "🎉 Application Submitted!",
        description: "Your application has been submitted for review",
      });
    },
    onError: () => {
      toast({
        title: "❌ Error",
        description: "Failed to submit application",
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
        <Footer />
      </div>
    );
  }

  if (!user || user.role === "admin") {
    return null;
  }

  const opportunities = opportunitiesData?.opportunities || [];
  const activeOpportunities = opportunities.filter(opp => opp.status === "open");
  const appliedOpportunityIds = new Set((applications || []).map(app => app.opportunityId));
  const availableOpportunities = activeOpportunities.filter(opp => !appliedOpportunityIds.has(opp.id));

  // Filter opportunities
  const filteredOpportunities = availableOpportunities.filter((opportunity) => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opportunity.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || opportunity.type === typeFilter;
    const matchesDuration = durationFilter === "all" || opportunity.duration === durationFilter;
    return matchesSearch && matchesType && matchesDuration;
  });

  const handleSubmitHours = () => {
    if (!selectedApplication || !submittedHours || parseInt(submittedHours) <= 0) return;
    
    submitHoursMutation.mutate({
      applicationId: selectedApplication.id,
      hours: parseInt(submittedHours),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted": return "bg-blue-100 text-blue-800 border-blue-200";
      case "hours_submitted": return "bg-purple-100 text-purple-800 border-purple-200";
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "hours_approved": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "⏳";
      case "accepted": return "🎉";
      case "hours_submitted": return "⏰";
      case "completed": return "🏆";
      case "hours_approved": return "✅";
      case "rejected": return "❌";
      default: return "📝";
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "Under review by admin";
      case "accepted": return "Approved! Start your work and submit hours when done";
      case "hours_submitted": return "Hours submitted, waiting for admin approval";
      case "completed": return "Completed successfully!";
      case "hours_approved": return "Hours approved and coins awarded!";
      case "rejected": return "Application was not approved";
      default: return "Status unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">
              🌟 Your Impact Dashboard
            </h1>
            <p className="text-xl text-gray-600">
              Track your applications and discover new opportunities to make a difference
            </p>
          </div>

          {/* My Applications Status */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <CardTitle className="flex items-center">
                <i className="fas fa-clipboard-list mr-3"></i>
                📋 My Applications ({(applications || []).length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {applicationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : !applications || applications.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-search text-blue-500 text-4xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No applications yet!</h3>
                  <p className="text-gray-600 mb-6">Ready to start making a difference? Browse opportunities below!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-white border-2 rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-lg text-gray-900">{application.opportunity?.title}</h4>
                            <Badge className={`${getStatusColor(application.status)} border`}>
                              {getStatusIcon(application.status)} {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{application.opportunity?.shortDescription}</p>
                          <p className="text-sm text-gray-500 mb-3">{getStatusMessage(application.status)}</p>
                          
                          <div className="flex items-center space-x-6 text-sm">
                            <span className="text-gray-500">
                              📅 Applied: {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd, yyyy") : "Unknown"}
                            </span>
                            {application.coinsAwarded > 0 && (
                              <span className="text-green-600 font-medium flex items-center">
                                <div className="coin-icon mr-1" style={{ width: "16px", height: "16px", fontSize: "12px" }}>₹</div>
                                {application.coinsAwarded} coins earned
                              </span>
                            )}
                            {application.hoursCompleted > 0 && (
                              <span className="text-blue-600 font-medium">
                                ⏱️ {application.hoursCompleted} hours completed
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-6">
                          {application.status === "accepted" && (
                            <Button
                              onClick={() => setSelectedApplication(application)}
                              className="bg-purple-600 hover:bg-purple-700"
                              data-testid={`button-submit-hours-${application.id}`}
                            >
                              <i className="fas fa-clock mr-2"></i>
                              Submit Hours
                            </Button>
                          )}
                          <Link href={`/opportunity/${application.opportunityId}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-opportunity-${application.id}`}>
                              <i className="fas fa-eye mr-1"></i>
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Opportunities */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className="fas fa-search mr-3"></i>
                  🔍 Discover Opportunities ({filteredOpportunities.length} available)
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="🔍 Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                    data-testid="input-search-opportunities"
                  />
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-12" data-testid="select-type-filter">
                    <SelectValue placeholder="🏷️ Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="tutoring">📚 Tutoring</SelectItem>
                    <SelectItem value="environmental">🌱 Environmental</SelectItem>
                    <SelectItem value="community">🏘️ Community Service</SelectItem>
                    <SelectItem value="healthcare">🏥 Healthcare</SelectItem>
                    <SelectItem value="education">🎓 Education</SelectItem>
                    <SelectItem value="technology">💻 Technology</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={durationFilter} onValueChange={setDurationFilter}>
                  <SelectTrigger className="h-12" data-testid="select-duration-filter">
                    <SelectValue placeholder="⏱️ Filter by duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Durations</SelectItem>
                    <SelectItem value="1-3 hours">⚡ 1-3 hours</SelectItem>
                    <SelectItem value="half-day">🕐 Half day</SelectItem>
                    <SelectItem value="full-day">📅 Full day</SelectItem>
                    <SelectItem value="multiple-days">📆 Multiple days</SelectItem>
                    <SelectItem value="ongoing">🔄 Ongoing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opportunities Grid */}
              {opportunitiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-search text-gray-400 text-4xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {searchQuery || typeFilter !== "all" || durationFilter !== "all" 
                      ? "No opportunities match your filters" 
                      : "No new opportunities available"
                    }
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchQuery || typeFilter !== "all" || durationFilter !== "all" 
                      ? "Try adjusting your search filters" 
                      : "Check back soon for new opportunities!"
                    }
                  </p>
                  {(searchQuery || typeFilter !== "all" || durationFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setTypeFilter("all");
                        setDurationFilter("all");
                      }}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredOpportunities.map((opportunity) => (
                    <div key={opportunity.id} className="bg-white border-2 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="relative">
                        <img
                          src={opportunity.imageUrl || `https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=200&fit=crop&auto=format`}
                          alt={opportunity.title}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white border-0 shadow-lg">
                            ✨ New
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-2">{opportunity.title}</h3>
                          <p className="text-gray-600 text-sm line-clamp-3">{opportunity.shortDescription}</p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Badge className="bg-blue-100 text-blue-800 capitalize">
                            🏷️ {opportunity.type}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            ⏱️ {opportunity.duration}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">💰 Reward Rate:</span>
                            <span className="font-semibold text-green-600 flex items-center">
                              <div className="coin-icon mr-1" style={{ width: "14px", height: "14px", fontSize: "10px" }}>₹</div>
                              {opportunity.coinsPerHour} per hour
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">🎯 Max Coins:</span>
                            <span className="font-semibold text-blue-600 flex items-center">
                              <div className="coin-icon mr-1" style={{ width: "14px", height: "14px", fontSize: "10px" }}>₹</div>
                              {opportunity.maxCoins}
                            </span>
                          </div>
                          {opportunity.location && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">📍 Location:</span>
                              <span className="text-gray-800">{opportunity.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2 pt-2">
                          <Link href={`/opportunity/${opportunity.id}`}>
                            <Button variant="outline" className="w-full" data-testid={`button-view-details-${opportunity.id}`}>
                              <i className="fas fa-info-circle mr-2"></i>
                              View Full Details
                            </Button>
                          </Link>
                          <Button
                            onClick={() => applyMutation.mutate(opportunity.id)}
                            disabled={applyMutation.isPending}
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg"
                            data-testid={`button-apply-${opportunity.id}`}
                          >
                            <i className="fas fa-hand-point-right mr-2"></i>
                            {applyMutation.isPending ? "Applying..." : "Apply Now"}
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
      </main>

      {/* Submit Hours Dialog */}
      <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
        <DialogContent className="sm:max-w-md" data-testid="dialog-submit-hours">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <i className="fas fa-clock mr-3 text-purple-600"></i>
              ⏰ Submit Your Completed Hours
            </DialogTitle>
            <DialogDescription>
              Great work on <strong>{selectedApplication?.opportunity?.title}</strong>! 
              Please enter the number of hours you spent on this opportunity.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="hours" className="text-sm font-medium">Hours Completed</Label>
              <Input
                id="hours"
                type="number"
                placeholder="Enter hours completed"
                value={submittedHours}
                onChange={(e) => setSubmittedHours(e.target.value)}
                className="h-12 text-lg"
                data-testid="input-submitted-hours"
              />
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 flex items-center">
                  <i className="fas fa-info-circle mr-2"></i>
                  <strong>Rate:</strong> {selectedApplication?.opportunity?.coinsPerHour} coins/hour 
                  <span className="mx-2">•</span>
                  <strong>Max:</strong> {selectedApplication?.opportunity?.maxCoins} coins
                </p>
                {submittedHours && parseInt(submittedHours) > 0 && (
                  <p className="text-sm text-green-700 font-medium mt-1 flex items-center">
                    💰 You'll earn: {Math.min(
                      parseInt(submittedHours) * (selectedApplication?.opportunity?.coinsPerHour || 0),
                      selectedApplication?.opportunity?.maxCoins || 0
                    )} coins
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
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
              disabled={submitHoursMutation.isPending || !submittedHours || parseInt(submittedHours) <= 0}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="button-confirm-submit-hours"
            >
              {submitHoursMutation.isPending ? "Submitting..." : "🚀 Submit Hours"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}