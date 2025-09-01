import { useState } from "react";
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
import type { Opportunity, User } from "@shared/schema";

export default function SuperHome() {
  const { user, isLoading: authLoading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: opportunitiesData, isLoading: opportunitiesLoading } = useQuery<{
    opportunities: Opportunity[];
  }>({
    queryKey: ["/api/opportunities"],
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds to catch auto-closed opportunities
    staleTime: 0, // Always consider data stale to force fresh fetches
    cacheTime: 0, // Don't cache results
  });

  const { data: leaderboard, isLoading: leaderboardLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard"],
    enabled: !!user,
  });

  const { data: userApplications, isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: [`/api/applications/user/${user?.id}`],
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-64 w-full rounded-2xl" />
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
  const topStudents = Array.isArray(leaderboard) ? leaderboard.slice(0, 5) : [];
  // Filter applications to only show those for open opportunities
  const activeApplications = Array.isArray(userApplications) ? userApplications.filter(app => 
    app.opportunity && app.opportunity.status === "open"
  ) : [];
  const recentApplications = activeApplications.slice(0, 3);

  // User ranking and progress
  const userRank = (leaderboard || []).findIndex((u: any) => u.id === user.id) + 1;
  const totalCoins = user.coins || 0;
  const completedApplications = activeApplications.filter((app: any) => 
    app.status === "completed" || app.status === "hours_approved"
  ).length;

  // Motivational messages based on progress
  const getMotivationalMessage = () => {
    if (completedApplications === 0) {
      return "🌟 Your impact journey starts here!";
    } else if (completedApplications < 3) {
      return "🚀 You're making great progress!";
    } else if (completedApplications < 10) {
      return "🏆 You're becoming a change-maker!";
    } else {
      return "👑 You're an impact champion!";
    }
  };

  const featuredOpportunities = activeOpportunities.slice(0, 6);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-10">
          {/* Hero Section with Personal Stats */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 opacity-90 rounded-3xl"></div>
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl"></div>
            
            <div className="relative p-10 text-center">
              <div className="inline-flex items-center space-x-6 mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <span className="text-3xl font-bold text-white">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
                <div className="text-left">
                  <h1 className="text-5xl font-bold text-white mb-2">
                    Hey {user.firstName}! 👋
                  </h1>
                  <p className="text-2xl text-blue-100 mb-2">{getMotivationalMessage()}</p>
                  <div className="flex items-center space-x-4 text-lg text-white/90">
                    <span className="flex items-center">
                      <div className="coin-icon mr-2" style={{ width: "20px", height: "20px", fontSize: "14px" }}>₹</div>
                      {totalCoins} coins earned
                    </span>
                    <span>•</span>
                    <span>#{userRank || '?'} on leaderboard</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mb-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{completedApplications}</div>
                  <div className="text-blue-100">Projects Done</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{recentApplications.length}</div>
                  <div className="text-blue-100">Active Applications</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">{activeOpportunities.length}</div>
                  <div className="text-blue-100">Opportunities Available</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl shadow-lg transform hover:scale-105 transition-all" data-testid="button-explore-opportunities">
                    <i className="fas fa-compass mr-2"></i>
                    Explore Opportunities
                  </Button>
                </Link>
                <Link href="/leaderboard">
                  <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-purple-700 px-8 py-3 rounded-xl font-semibold" data-testid="button-view-rankings">
                    <i className="fas fa-trophy mr-2"></i>
                    View Rankings
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Application Status */}
          {(recentApplications.length > 0) && (
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardTitle className="flex items-center justify-between text-2xl">
                  <div className="flex items-center">
                    <i className="fas fa-rocket mr-3"></i>
                    🚀 Your Impact Progress
                  </div>
                  <Link href="/dashboard">
                    <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {applicationsLoading ? (
                  <div className="p-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentApplications.map((application: any, index) => (
                      <div key={application.id} className={`p-6 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                                {application.opportunity?.title?.[0] || '?'}
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-gray-900">{application.opportunity?.title}</h4>
                                <p className="text-gray-600 text-sm">{application.opportunity?.shortDescription}</p>
                              </div>
                              <Badge className={`px-4 py-2 text-sm font-medium rounded-full ${
                                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                application.status === 'accepted' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                                application.status === 'hours_submitted' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                application.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-300' :
                                'bg-gray-100 text-gray-800 border border-gray-300'
                              }`}>
                                {application.status === 'pending' && '⏳ Under Review'}
                                {application.status === 'accepted' && '🎉 Ready to Start'}
                                {application.status === 'hours_submitted' && '⏰ Hours Under Review'}
                                {application.status === 'completed' && '🏆 Completed'}
                                {application.status === 'hours_approved' && '🔄 Can Continue'}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-4 gap-4">
                              <div className="text-center p-2 bg-blue-50 rounded-lg">
                                <div className="text-xs text-blue-600 mb-1">Applied</div>
                                <div className="font-semibold text-blue-800 text-sm">
                                  {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd") : "Unknown"}
                                </div>
                              </div>
                              {application.coinsAwarded > 0 && (
                                <div className="text-center p-2 bg-yellow-50 rounded-lg">
                                  <div className="text-xs text-yellow-600 mb-1">Earned</div>
                                  <div className="font-bold text-yellow-800 text-sm flex items-center justify-center">
                                    <div className="coin-icon mr-1" style={{ width: "12px", height: "12px", fontSize: "8px" }}>₹</div>
                                    {application.coinsAwarded}
                                  </div>
                                </div>
                              )}
                              {application.hoursCompleted > 0 && (
                                <div className="text-center p-2 bg-green-50 rounded-lg">
                                  <div className="text-xs text-green-600 mb-1">Hours</div>
                                  <div className="font-semibold text-green-800 text-sm">
                                    {application.hoursCompleted}h
                                  </div>
                                </div>
                              )}
                              <div className="text-center p-2 bg-purple-50 rounded-lg">
                                <div className="text-xs text-purple-600 mb-1">Potential</div>
                                <div className="font-bold text-purple-800 text-sm flex items-center justify-center">
                                  <div className="coin-icon mr-1" style={{ width: "12px", height: "12px", fontSize: "8px" }}>₹</div>
                                  {application.opportunity?.maxCoins}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-6">
                            <Link href={`/opportunity/${application.opportunityId}`}>
                              <Button variant="outline" size="sm" data-testid={`button-view-${application.id}`}>
                                <i className="fas fa-arrow-right mr-1"></i>
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
          )}

          {/* Featured Opportunities Carousel */}
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <CardTitle className="flex items-center justify-between text-2xl">
                <div className="flex items-center">
                  <i className="fas fa-star mr-3"></i>
                  ✨ Trending Opportunities
                </div>
                <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                  {featuredOpportunities.length} available
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              {opportunitiesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                  ))}
                </div>
              ) : featuredOpportunities.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-6">🌱</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">New opportunities are growing!</h3>
                  <p className="text-gray-600 text-lg mb-6">
                    We're cultivating amazing ways for you to make an impact. Check back soon!
                  </p>
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700">
                      <i className="fas fa-seedling mr-2"></i>
                      Stay Tuned
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {featuredOpportunities.map((opportunity, index: number) => (
                    <div 
                      key={opportunity.id}
                      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100"
                    >
                      {/* Opportunity Image */}
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={opportunity.imageUrl || `https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=400&h=200&fit=crop&auto=format&q=80`}
                          alt={opportunity.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white border-0 shadow-lg">
                            {index < 3 ? '🔥 Hot' : '✨ New'}
                          </Badge>
                        </div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h4 className="font-bold text-lg text-white line-clamp-2">{opportunity.title}</h4>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4">
                        <p className="text-gray-600 text-sm line-clamp-2">{opportunity.shortDescription}</p>
                        
                        <div className="flex items-center justify-between">
                          <Badge className="bg-blue-100 text-blue-800 capitalize">
                            🏷️ {opportunity.type}
                          </Badge>
                          <Badge className="bg-purple-100 text-purple-800">
                            ⏱️ {opportunity.duration}
                          </Badge>
                        </div>
                        
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                          <div className="text-center">
                            <div className="text-xs text-orange-600 mb-1">Earn Up To</div>
                            <div className="text-xl font-bold text-orange-800 flex items-center justify-center">
                              <div className="coin-icon mr-1" style={{ width: "16px", height: "16px", fontSize: "12px" }}>₹</div>
                              {opportunity.maxCoins}
                            </div>
                            <div className="text-xs text-yellow-700 mt-1">
                              @ {opportunity.coinsPerHour} coins/hour
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Link href={`/opportunity/${opportunity.id}`}>
                            <Button variant="outline" className="w-full border-2 hover:border-green-400 hover:bg-green-50" data-testid={`button-learn-more-${opportunity.id}`}>
                              <i className="fas fa-info-circle mr-2"></i>
                              Learn More
                            </Button>
                          </Link>
                          <Link href="/dashboard">
                            <Button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg transform hover:scale-105 transition-all" data-testid={`button-apply-now-${opportunity.id}`}>
                              <i className="fas fa-rocket mr-2"></i>
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

          {/* Community Leaderboard Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Contributors */}
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <CardTitle className="flex items-center justify-between text-xl">
                  <div className="flex items-center">
                    <i className="fas fa-crown mr-3"></i>
                    👑 Top Contributors
                  </div>
                  <Link href="/leaderboard">
                    <Button variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {leaderboardLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : topStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🌟</div>
                    <p className="text-gray-600 mb-2">Be the first to make an impact!</p>
                    <p className="text-gray-500 text-sm">Complete your first opportunity to appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topStudents.map((student, index) => (
                      <div key={student.id} className={`flex items-center space-x-4 p-4 rounded-xl transition-all ${
                        student.id === user.id ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                          {student.firstName?.[0]}{student.lastName?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold ${student.id === user.id ? 'text-blue-900' : 'text-gray-900'}`}>
                            {student.anonymizeLeaderboard ? "Anonymous Student" : `${student.firstName} ${student.lastName}`}
                            {student.id === user.id && " (You!)"}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-orange-700 flex items-center">
                              <div className="coin-icon mr-1" style={{ width: "12px", height: "12px", fontSize: "8px" }}>₹</div>
                              {student.coins || 0}
                            </span>
                            <span className="text-gray-600">
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

            {/* Platform Impact Stats */}
            <Card className="shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center text-xl">
                  <i className="fas fa-chart-line mr-3"></i>
                  📈 Community Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
                    <div className="text-4xl font-bold text-purple-800 mb-2">
                      {(leaderboard || []).reduce((sum, student) => sum + (student.coins || 0), 0)}
                    </div>
                    <div className="text-purple-600 font-medium">Total Coins Earned</div>
                    <div className="text-purple-500 text-sm mt-1">by our amazing community</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-800">{opportunities.length}</div>
                      <div className="text-green-600 text-sm">Total Opportunities</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-800">{(leaderboard || []).length}</div>
                      <div className="text-blue-600 text-sm">Active Students</div>
                    </div>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="text-2xl font-bold text-orange-800">
                      {(leaderboard || []).reduce((sum, student) => sum + (student._count?.completedApplications || 0), 0)}
                    </div>
                    <div className="text-orange-600 text-sm">Projects Completed</div>
                    <div className="text-orange-500 text-xs mt-1">making real difference</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <Card className="shadow-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 text-white overflow-hidden border-0">
            <CardContent className="p-12 text-center relative">
              <div className="absolute inset-0 bg-white/10 transform rotate-6 scale-110 rounded-3xl"></div>
              <div className="relative z-10">
                <div className="text-6xl mb-6">🌍</div>
                <h2 className="text-4xl font-bold mb-4">Ready to Change the World?</h2>
                <p className="text-2xl text-blue-100 mb-8">
                  Join {(leaderboard || []).length}+ students creating positive impact
                </p>
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <Link href="/dashboard">
                    <Button size="lg" className="bg-white text-purple-700 hover:bg-gray-100 font-bold px-10 py-4 rounded-2xl shadow-2xl transform hover:scale-105 transition-all text-lg" data-testid="button-start-making-impact">
                      <i className="fas fa-heart mr-3"></i>
                      Start Making Impact
                    </Button>
                  </Link>
                  <Link href="/leaderboard">
                    <Button variant="outline" size="lg" className="border-3 border-white text-white hover:bg-white hover:text-purple-700 px-10 py-4 rounded-2xl font-bold text-lg" data-testid="button-join-leaderboard">
                      <i className="fas fa-users mr-3"></i>
                      Join the Community
                    </Button>
                  </Link>
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