import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { Opportunity, UserWithApplications } from "@shared/schema";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useQuery<{
    opportunities: Opportunity[];
  }>({
    queryKey: ["/api/opportunities"],
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds to catch auto-closed opportunities
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<UserWithApplications[]>({
    queryKey: ["/api/leaderboard"],
    enabled: !!user,
  });

  const { data: userApplications, isLoading: applicationsLoading } = useQuery({
    queryKey: [`/api/applications/user/${user?.id}`],
    enabled: !!user,
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

  if (!user) {
    return null; // Should redirect to landing page
  }

  const opportunities = opportunitiesData?.opportunities || [];
  // Filter to only show open opportunities (exclude closed and filled)
  const activeOpportunities = opportunities.filter(opp => opp.status === "open");
  const topStudents = (leaderboard || []).slice(0, 5);
  const recentApplications = (userApplications || []).slice(0, 3);

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
      case "accepted": return "👍";
      case "hours_submitted": return "⏰";
      case "completed": return "🏆";
      case "hours_approved": return "✅";
      case "rejected": return "❌";
      default: return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Hero Welcome Section */}
          <div className="text-center space-y-6 py-12">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-gray-900">
                  Welcome back, {user.firstName}! 👋
                </h1>
                <p className="text-xl text-gray-600">Ready to make a difference today?</p>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-8 text-center">
              <div className="bg-white rounded-lg p-6 shadow-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-1">{user.coins || 0}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center">
                  <div className="coin-icon mr-1" style={{ width: "16px", height: "16px", fontSize: "12px" }}>₹</div>
                  Total Coins Earned
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-1">{recentApplications.length}</div>
                <div className="text-sm text-gray-600">Active Applications</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-1">{activeOpportunities.length}</div>
                <div className="text-sm text-gray-600">Available Opportunities</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="shadow-lg border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <CardTitle className="flex items-center text-xl">
                <i className="fas fa-lightning-bolt mr-3"></i>
                ⚡ Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white shadow-lg" data-testid="button-view-dashboard">
                    <i className="fas fa-tachometer-alt text-2xl mb-2"></i>
                    <span className="text-sm font-medium">View Dashboard</span>
                  </Button>
                </Link>
                
                <Link href="/leaderboard">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white shadow-lg" data-testid="button-view-leaderboard">
                    <i className="fas fa-trophy text-2xl mb-2"></i>
                    <span className="text-sm font-medium">View Leaderboard</span>
                  </Button>
                </Link>
                
                <Link href="/profile">
                  <Button className="w-full h-20 flex flex-col items-center justify-center bg-gradient-to-br from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white shadow-lg" data-testid="button-view-profile">
                    <i className="fas fa-user text-2xl mb-2"></i>
                    <span className="text-sm font-medium">My Profile</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* My Recent Applications */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <i className="fas fa-clipboard-list mr-3"></i>
                  📋 My Recent Applications
                </div>
                <Link href="/dashboard">
                  <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {applicationsLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : recentApplications.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-search text-blue-500 text-4xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to get started?</h3>
                  <p className="text-gray-600 mb-6">Browse available opportunities and start making a difference!</p>
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-blue-600 hover:bg-blue-700" data-testid="button-browse-opportunities">
                      <i className="fas fa-search mr-2"></i>
                      Browse Opportunities
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((application: any) => (
                    <div key={application.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">{application.opportunity?.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{application.opportunity?.shortDescription}</p>
                          <div className="flex items-center space-x-4">
                            <Badge className={`${getStatusColor(application.status)} border`}>
                              {getStatusIcon(application.status)} {(application.status || 'pending').charAt(0).toUpperCase() + (application.status || 'pending').slice(1).replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Applied: {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd, yyyy") : "Unknown"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {application.coinsAwarded > 0 && (
                            <div className="flex items-center space-x-1 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                              <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "12px" }}>₹</div>
                              <span className="font-semibold text-yellow-800">{application.coinsAwarded}</span>
                            </div>
                          )}
                          <Link href={`/opportunity/${application.opportunityId}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-opportunity-${application.id}`}>
                              <i className="fas fa-eye mr-1"></i>
                              View
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Featured Opportunities */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-star mr-3"></i>
                    🌟 Featured Opportunities
                  </div>
                  <Link href="/dashboard">
                    <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      Browse All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {opportunitiesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : activeOpportunities.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-clock text-gray-400 text-3xl mb-3"></i>
                    <p className="text-gray-600">No opportunities available right now</p>
                    <p className="text-gray-500 text-sm">Check back soon for new opportunities!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeOpportunities.slice(0, 3).map((opportunity) => (
                      <div key={opportunity.id} className="bg-gradient-to-r from-white to-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{opportunity.title}</h4>
                            <p className="text-sm text-gray-600 mb-2">{opportunity.shortDescription}</p>
                            <div className="flex items-center space-x-4">
                              <Badge className="bg-green-100 text-green-800 border border-green-200 capitalize">
                                🏷️ {opportunity.type}
                              </Badge>
                              <span className="text-sm text-green-700 font-medium flex items-center">
                                <div className="coin-icon mr-1" style={{ width: "14px", height: "14px", fontSize: "10px" }}>₹</div>
                                {opportunity.coinsPerHour}/hour
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Link href={`/opportunity/${opportunity.id}`}>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" data-testid={`button-apply-${opportunity.id}`}>
                                <i className="fas fa-hand-point-right mr-1"></i>
                                Apply Now
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

            {/* Top Contributors */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="fas fa-medal mr-3"></i>
                    🏅 Top Contributors
                  </div>
                  <Link href="/leaderboard">
                    <Button variant="secondary" size="sm" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {leaderboardLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : topStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <i className="fas fa-users text-gray-400 text-3xl mb-3"></i>
                    <p className="text-gray-600">No contributors yet</p>
                    <p className="text-gray-500 text-sm">Be the first to complete an opportunity!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topStudents.map((student, index) => (
                      <div key={student.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-white to-orange-50 border border-orange-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                            index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                            'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {student.anonymizeLeaderboard ? "Anonymous Student" : `${student.firstName} ${student.lastName}`}
                          </p>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-orange-700 flex items-center">
                              <div className="coin-icon mr-1" style={{ width: "14px", height: "14px", fontSize: "10px" }}>₹</div>
                              {student.coins || 0} coins
                            </span>
                            <span className="text-sm text-gray-600">
                              🎯 {student._count?.completedApplications || 0} completed
                            </span>
                          </div>
                        </div>
                        {index < 3 && (
                          <div className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Motivational Call to Action */}
          <Card className="shadow-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white overflow-hidden">
            <CardContent className="p-8 text-center relative">
              <div className="absolute inset-0 bg-white/10 transform rotate-12 scale-150"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-4">🚀 Ready to Make Impact?</h2>
                <p className="text-xl text-blue-100 mb-6">
                  Join {(leaderboard || []).length} students making a difference in our community
                </p>
                <div className="flex justify-center space-x-4">
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-100 font-semibold" data-testid="button-start-volunteering">
                      <i className="fas fa-heart mr-2"></i>
                      Start Volunteering
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/20" data-testid="button-see-rankings">
                      <i className="fas fa-chart-line mr-2"></i>
                      See Rankings
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center">
                <i className="fas fa-chart-pie mr-3 text-blue-600"></i>
                📊 Platform Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">{opportunities.length}</div>
                  <div className="text-sm text-gray-600">Total Opportunities</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 mb-1">{(leaderboard || []).length}</div>
                  <div className="text-sm text-gray-600">Active Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 mb-1">
                    {(leaderboard || []).reduce((sum, student) => sum + (student.coins || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Coins Earned</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 mb-1">
                    {(leaderboard || []).reduce((sum, student) => sum + (student._count?.completedApplications || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Projects Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}