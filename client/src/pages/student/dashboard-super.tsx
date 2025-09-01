import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import type { Opportunity, ApplicationWithDetails, User } from "@shared/schema";

export default function SuperStudentDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("recommended");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [submittedHours, setSubmittedHours] = useState("");
  const [showOnboardingHelp, setShowOnboardingHelp] = useState(false);

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useQuery<{
    opportunities: Opportunity[];
  }>({
    queryKey: ["/api/opportunities"],
    refetchInterval: 10000, // Refresh every 10 seconds to catch auto-closed opportunities
    enabled: !!user,
    staleTime: 0, // Always consider data stale to force fresh fetches
    gcTime: 0, // Don't cache results
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: [`/api/applications/user/${user?.id}`],
    enabled: !!user?.id,
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
    enabled: !!user,
  });

  const submitHoursMutation = useMutation({
    mutationFn: async (data: { applicationId: string; hours: number }) => {
      await apiRequest("PATCH", `/api/applications/${data.applicationId}/submit-hours`, {
        hours: data.hours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/applications/user/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunity-progress"] });
      setSelectedApplication(null);
      setSubmittedHours("");
      toast({
        title: "🎉 Hours Submitted Successfully!",
        description: "Your contribution has been logged and is being reviewed",
      });
    },
    onError: () => {
      toast({
        title: "❌ Submission Failed",
        description: "Please try again or contact support",
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
        title: "🚀 Application Submitted!",
        description: "You're one step closer to making a difference!",
      });
    },
    onError: () => {
      toast({
        title: "❌ Application Failed",
        description: "Please try again or contact support",
        variant: "destructive",
      });
    },
  });

  // Check if user is new (show onboarding)
  useEffect(() => {
    if (user && applications && applications.length === 0 && !opportunitiesLoading) {
      setShowOnboardingHelp(true);
    }
  }, [user, applications, opportunitiesLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
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

  const opportunities = (opportunitiesData as any)?.opportunities || [];
  // Filter to only show open opportunities (exclude closed and filled)
  const activeOpportunities = opportunities.filter((opp: any) => opp.status === "open");
  const appliedOpportunityIds = new Set((applications || []).map((app: any) => app.opportunityId));
  const availableOpportunities = activeOpportunities.filter((opp: any) => !appliedOpportunityIds.has(opp.id));

  // Filter applications to only show those for open opportunities
  const activeApplications = (applications || []).filter((app: any) => 
    app.opportunity && app.opportunity.status === "open"
  );

  // Calculate user stats and progress using filtered applications
  const totalCoins = user.coins || 0;
  const completedApplications = activeApplications.filter(app => 
    app.status === "completed" || app.status === "hours_approved"
  ).length;
  const ongoingApplications = activeApplications.filter(app => 
    app.status === "accepted" || app.status === "hours_submitted" || app.status === "pending"
  ).length;
  const totalHoursCompleted = activeApplications.reduce((total, app) => 
    total + (app.hoursCompleted || 0), 0
  );

  // User ranking
  const userRank = (leaderboard || []).findIndex(u => u.id === user.id) + 1;
  const totalUsers = (leaderboard || []).length;

  // Progress calculations
  const nextMilestone = Math.ceil((totalCoins + 1) / 100) * 100;
  const progressToNextMilestone = ((totalCoins % 100) / 100) * 100;
  const userLevel = Math.floor(totalCoins / 100) + 1;

  // Smart filtering
  const getFilteredOpportunities = () => {
    let filtered = availableOpportunities;

    if (searchQuery) {
      filtered = filtered.filter((opp: any) => 
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.shortDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    switch (selectedFilter) {
      case "recommended":
        // Sort by coins per hour and user compatibility
        return filtered.sort((a: any, b: any) => (b.coinsPerHour || 0) - (a.coinsPerHour || 0)).slice(0, 6);
      case "high_reward":
        return filtered.sort((a: any, b: any) => (b.maxCoins || 0) - (a.maxCoins || 0));
      case "quick_wins":
        return filtered.filter((opp: any) => opp.duration === "instant" || opp.duration === "1-3days");
      case "new":
        return filtered.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      default:
        return filtered;
    }
  };

  const filteredOpportunities = getFilteredOpportunities();

  const handleSubmitHours = () => {
    if (!selectedApplication || !submittedHours || parseInt(submittedHours) <= 0) return;
    
    submitHoursMutation.mutate({
      applicationId: selectedApplication.id,
      hours: parseInt(submittedHours),
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-300";
      case "accepted": return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300";
      case "hours_submitted": return "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-300";
      case "completed": return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300";
      case "hours_approved": return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300";
      case "rejected": return "bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-red-300";
      default: return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "⏳";
      case "accepted": return "🎉";
      case "hours_submitted": return "⏰";
      case "completed": return "🏆";
      case "hours_approved": return "🔄";
      case "rejected": return "❌";
      default: return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          {/* Hero Stats Dashboard */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 rounded-3xl opacity-90"></div>
            <div className="relative bg-white/95 backdrop-blur rounded-3xl p-8 shadow-2xl border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-4 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-500 to-green-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </span>
                  </div>
                  <div className="text-left">
                    <h1 className="text-4xl font-bold text-gray-900 mb-1">
                      Welcome back, {user.firstName}! 🌟
                    </h1>
                    <p className="text-xl text-gray-600">Level {userLevel} Impact Maker</p>
                  </div>
                </div>

                {/* Progress Ring */}
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${progressToNextMilestone * 2.83} ${(100 - progressToNextMilestone) * 2.83}`}
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="50%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#10b981" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 flex items-center justify-center">
                        <div className="coin-icon mr-1" style={{ width: "20px", height: "20px", fontSize: "14px" }}>₹</div>
                        {totalCoins}
                      </div>
                      <div className="text-xs text-gray-600">to {nextMilestone}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl border border-purple-300">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-purple-800">{completedApplications}</div>
                  <div className="text-sm text-purple-600">Completed</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-2xl font-bold text-blue-800">{activeApplications.length}</div>
                  <div className="text-sm text-blue-600">Active</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
                  <div className="text-3xl mb-2">⏱️</div>
                  <div className="text-2xl font-bold text-green-800">{totalHoursCompleted}h</div>
                  <div className="text-sm text-green-600">Hours</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl border border-orange-300">
                  <div className="text-3xl mb-2">📊</div>
                  <div className="text-2xl font-bold text-orange-800">#{userRank || '?'}</div>
                  <div className="text-sm text-orange-600">Rank</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex justify-center space-x-4 mt-6">
                <Link href="/leaderboard">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg" data-testid="button-view-leaderboard">
                    <i className="fas fa-trophy mr-2"></i>
                    View Rankings
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="border-2 border-gray-300 hover:border-gray-400" data-testid="button-view-profile">
                    <i className="fas fa-user mr-2"></i>
                    My Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* My Applications - Enhanced Cards */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
              <CardTitle className="flex items-center text-2xl">
                <i className="fas fa-rocket mr-3"></i>
                🚀 My Impact Journey ({activeApplications.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {applicationsLoading ? (
                <div className="p-6 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-lg" />
                  ))}
                </div>
              ) : !activeApplications || activeApplications.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">🌟</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Start Your Journey?</h3>
                  <p className="text-gray-600 mb-8 text-lg">Every great impact story begins with a single step!</p>
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transform hover:scale-105 transition-all"
                    onClick={() => setShowOnboardingHelp(true)}
                    data-testid="button-start-journey"
                  >
                    <i className="fas fa-play mr-2"></i>
                    Start Your Journey
                  </Button>
                </div>
              ) : (
                <div className="space-y-0">
                  {activeApplications.map((application, index) => (
                    <div 
                      key={application.id} 
                      className={`p-6 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                              {application.opportunity?.title?.[0] || '?'}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-xl text-gray-900 mb-1">{application.opportunity?.title}</h4>
                              <p className="text-gray-600 text-sm">{application.opportunity?.shortDescription}</p>
                            </div>
                            <Badge className={`${getStatusColor(application.status || 'pending')} border-2 px-4 py-2 text-sm font-medium`}>
                              {getStatusIcon(application.status || 'pending')} {application.status === "hours_approved" ? "Can Continue" : (application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="text-xs text-blue-600 mb-1">Applied</div>
                              <div className="font-semibold text-blue-800 text-sm">
                                {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd") : "Unknown"}
                              </div>
                            </div>
                            {(application.coinsAwarded || 0) > 0 && (
                              <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="text-xs text-yellow-600 mb-1">Earned</div>
                                <div className="font-bold text-yellow-800 text-sm flex items-center justify-center">
                                  <div className="coin-icon mr-1" style={{ width: "12px", height: "12px", fontSize: "8px" }}>₹</div>
                                  {application.coinsAwarded || 0}
                                </div>
                              </div>
                            )}
                            {(application.hoursCompleted || 0) > 0 && (
                              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                                <div className="text-xs text-green-600 mb-1">Hours</div>
                                <div className="font-semibold text-green-800 text-sm">
                                  {application.hoursCompleted || 0}h
                                </div>
                              </div>
                            )}
                            {(application.status === "accepted" || application.status === "hours_approved") && (
                              <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="text-xs text-purple-600 mb-1">
                                  {application.status === "hours_approved" ? "Can Add More" : "Action Needed"}
                                </div>
                                <div className="font-semibold text-purple-800 text-sm">
                                  {application.status === "hours_approved" ? "More Hours" : "Submit Hours"}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2 ml-6">
                          {(application.status === "accepted" || application.status === "hours_approved") && (
                            <Button
                              onClick={() => setSelectedApplication(application)}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
                              data-testid={`button-submit-hours-${application.id}`}
                            >
                              <i className="fas fa-clock mr-2"></i>
                              {application.status === "hours_approved" ? "Submit More Hours" : "Submit Hours"}
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

          {/* Smart Opportunity Discovery */}
          <Card className="shadow-xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 text-white">
              <CardTitle className="flex items-center justify-between text-2xl">
                <div className="flex items-center">
                  <i className="fas fa-compass mr-3"></i>
                  🧭 Discover Perfect Opportunities
                </div>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  {filteredOpportunities.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Smart Filters */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="relative flex-1 min-w-64">
                  <Input
                    type="text"
                    placeholder="🔍 Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 text-lg pl-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    data-testid="input-search-opportunities"
                  />
                  <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg"></i>
                </div>
                
                {/* Filter Pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "recommended", label: "⭐ Recommended", color: "purple" },
                    { value: "high_reward", label: "💎 High Reward", color: "yellow" },
                    { value: "quick_wins", label: "⚡ Quick Wins", color: "green" },
                    { value: "new", label: "🆕 New", color: "blue" },
                  ].map((filter) => (
                    <Button
                      key={filter.value}
                      variant={selectedFilter === filter.value ? "default" : "outline"}
                      onClick={() => setSelectedFilter(filter.value)}
                      className={`h-12 px-6 rounded-xl transition-all ${
                        selectedFilter === filter.value
                          ? `bg-${filter.color}-600 text-white shadow-lg transform scale-105`
                          : `hover:bg-${filter.color}-50 border-2`
                      }`}
                      data-testid={`button-filter-${filter.value}`}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Opportunity Cards Grid */}
              {opportunitiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-80 w-full rounded-2xl" />
                  ))}
                </div>
              ) : filteredOpportunities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">🔍</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchQuery ? "No matches found" : "All caught up!"}
                  </h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {searchQuery 
                      ? "Try adjusting your search or filters" 
                      : "You've seen all available opportunities. Check back soon for new ones!"
                    }
                  </p>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedFilter("recommended");
                      }}
                      className="border-2"
                      data-testid="button-clear-search"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredOpportunities.map((opportunity: any, index: any) => (
                    <div 
                      key={opportunity.id} 
                      className="group bg-white rounded-2xl overflow-hidden shadow-lg border-2 border-gray-100 hover:shadow-2xl hover:border-blue-300 transform hover:-translate-y-2 transition-all duration-300"
                    >
                      {/* Image Header */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={opportunity.imageUrl || `https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=200&fit=crop&auto=format&q=80`}
                          alt={opportunity.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className="absolute top-4 right-4 space-y-2">
                          <Badge className="bg-green-500 text-white border-0 shadow-lg">
                            ✨ Featured
                          </Badge>
                          {index < 3 && selectedFilter === "recommended" && (
                            <Badge className="bg-purple-500 text-white border-0 shadow-lg block">
                              🎯 Perfect Match
                            </Badge>
                          )}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="font-bold text-xl text-white mb-1 line-clamp-2">{opportunity.title}</h3>
                        </div>
                      </div>
                      
                      {/* Card Content */}
                      <div className="p-6 space-y-4">
                        <p className="text-gray-600 text-sm line-clamp-2 mb-4">{opportunity.shortDescription}</p>
                        
                        {/* Tags */}
                        <div className="flex items-center space-x-2 mb-4">
                          <Badge className="bg-blue-100 text-blue-800 capitalize border border-blue-200">
                            🏷️ {opportunity.type}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                            ⏱️ {opportunity.duration}
                          </Badge>
                        </div>
                        
                        {/* Reward Info */}
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                              <div className="text-xs text-yellow-700 mb-1">Rate</div>
                              <div className="font-bold text-yellow-800 flex items-center justify-center">
                                <div className="coin-icon mr-1" style={{ width: "14px", height: "14px", fontSize: "10px" }}>₹</div>
                                {opportunity.coinsPerHour}/hr
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-orange-700 mb-1">Max</div>
                              <div className="font-bold text-orange-800 flex items-center justify-center">
                                <div className="coin-icon mr-1" style={{ width: "14px", height: "14px", fontSize: "10px" }}>₹</div>
                                {opportunity.maxCoins}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="space-y-3 pt-2">
                          <Link href={`/opportunity/${opportunity.id}`}>
                            <Button 
                              variant="outline" 
                              className="w-full border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50" 
                              data-testid={`button-view-details-${opportunity.id}`}
                            >
                              <i className="fas fa-info-circle mr-2"></i>
                              View Full Details
                            </Button>
                          </Link>
                          <Button
                            onClick={() => applyMutation.mutate(opportunity.id)}
                            disabled={applyMutation.isPending}
                            className="w-full bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 hover:from-green-700 hover:via-teal-700 hover:to-blue-700 text-white shadow-lg transform hover:scale-105 transition-all h-12"
                            data-testid={`button-apply-${opportunity.id}`}
                          >
                            <i className="fas fa-rocket mr-2"></i>
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
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-purple-50 to-blue-50" data-testid="dialog-submit-hours">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <i className="fas fa-clock mr-3 text-purple-600"></i>
              ⏰ {selectedApplication?.status === "hours_approved" ? "Submit Additional Hours" : "Submit Your Impact Hours"}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {selectedApplication?.status === "hours_approved" ? (
                <>
                  Great work on <strong className="text-purple-700">{selectedApplication?.opportunity?.title}</strong>! 
                  You can continue contributing and earn more coins. Enter any additional hours completed.
                </>
              ) : (
                <>
                  Congratulations on completing <strong className="text-purple-700">{selectedApplication?.opportunity?.title}</strong>! 
                  Enter the hours you dedicated to this meaningful work.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="hours" className="text-lg font-medium mb-2 block">Hours Completed</Label>
              <Input
                id="hours"
                type="number"
                placeholder="Enter hours completed"
                value={submittedHours}
                onChange={(e) => setSubmittedHours(e.target.value)}
                className="h-14 text-xl border-2 border-purple-200 focus:border-purple-500 rounded-xl"
                data-testid="input-submitted-hours"
              />
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                <div className="grid grid-cols-2 gap-4 text-center mb-3">
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Rate per Hour</p>
                    <p className="text-lg font-bold text-blue-800 flex items-center justify-center">
                      <div className="coin-icon mr-1" style={{ width: "16px", height: "16px", fontSize: "12px" }}>₹</div>
                      {selectedApplication?.opportunity?.coinsPerHour}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-purple-700 font-medium">Maximum Coins</p>
                    <p className="text-lg font-bold text-purple-800 flex items-center justify-center">
                      <div className="coin-icon mr-1" style={{ width: "16px", height: "16px", fontSize: "12px" }}>₹</div>
                      {selectedApplication?.opportunity?.maxCoins}
                    </p>
                  </div>
                </div>
                {submittedHours && parseInt(submittedHours) > 0 && (
                  <div className="text-center p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg border border-green-300">
                    <p className="text-lg font-bold text-green-800 flex items-center justify-center">
                      🎉 You'll earn: 
                      <div className="coin-icon mx-2" style={{ width: "18px", height: "18px", fontSize: "14px" }}>₹</div>
                      {Math.min(
                        parseInt(submittedHours) * (selectedApplication?.opportunity?.coinsPerHour || 0),
                        selectedApplication?.opportunity?.maxCoins || 0
                      )} coins!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="space-x-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedApplication(null);
                setSubmittedHours("");
              }}
              className="border-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitHours}
              disabled={submitHoursMutation.isPending || !submittedHours || parseInt(submittedHours) <= 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
              data-testid="button-confirm-submit-hours"
            >
              {submitHoursMutation.isPending ? "Submitting..." : "🚀 Submit Hours"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Onboarding Help Dialog */}
      <Dialog open={showOnboardingHelp} onOpenChange={setShowOnboardingHelp}>
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-purple-50 to-blue-50" data-testid="dialog-onboarding">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <div className="text-4xl mr-3">🌟</div>
              Welcome to Your Impact Journey!
            </DialogTitle>
            <DialogDescription className="text-lg">
              Ready to make a difference? Here's how to get started:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
              <div className="text-2xl">1️⃣</div>
              <div>
                <h4 className="font-semibold text-blue-900">Browse Opportunities</h4>
                <p className="text-sm text-blue-700">Explore amazing ways to contribute to your community</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="text-2xl">2️⃣</div>
              <div>
                <h4 className="font-semibold text-green-900">Apply & Get Approved</h4>
                <p className="text-sm text-green-700">Submit your application and wait for admin approval</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <div className="text-2xl">3️⃣</div>
              <div>
                <h4 className="font-semibold text-purple-900">Complete & Earn</h4>
                <p className="text-sm text-purple-700">Do the work, submit hours, and earn coins!</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setShowOnboardingHelp(false)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg w-full"
              data-testid="button-start-exploring"
            >
              🚀 Start Exploring Opportunities
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
}