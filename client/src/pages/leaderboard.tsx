import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserWithStats, OpportunityWithCreator } from "@shared/schema";

export default function Leaderboard() {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState("all");
  const [selectedActivity, setSelectedActivity] = useState("all");
  const [showAnonymized, setShowAnonymized] = useState(false);

  const { data: opportunities } = useQuery<{ opportunities: OpportunityWithCreator[] }>({
    queryKey: ["/api/opportunities"],
  });

  const { data: leaderboard, isLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/leaderboard", { timeframe, opportunityId: selectedActivity !== "all" ? selectedActivity : undefined, limit: 50 }],
  });

  const currentUserRank = leaderboard?.findIndex(u => u.id === user?.id) + 1 || 0;
  const currentUser = leaderboard?.find(u => u.id === user?.id);

  const formatUserName = (leaderboardUser: UserWithStats, index: number) => {
    if (leaderboardUser.anonymizeLeaderboard && leaderboardUser.id !== user?.id) {
      return `Student #${String(index + 1).padStart(3, '0')}`;
    }
    return `${leaderboardUser.firstName} ${leaderboardUser.lastName}`;
  };

  const getBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-gradient-to-br from-yellow-400 to-yellow-600"; // Gold
      case 2: return "bg-gradient-to-br from-gray-300 to-gray-500"; // Silver
      case 3: return "bg-gradient-to-br from-amber-600 to-amber-800"; // Bronze
      default: return "bg-primary";
    }
  };

  const getInitials = (leaderboardUser: UserWithStats) => {
    if (leaderboardUser.anonymizeLeaderboard && leaderboardUser.id !== user?.id) {
      return "??";
    }
    return `${leaderboardUser.firstName?.[0] || ""}${leaderboardUser.lastName?.[0] || ""}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              <i className="fas fa-trophy text-yellow-500 mr-3"></i>
              Leaderboard
            </h1>
            <p className="text-lg text-muted-foreground">
              See how you rank among your fellow students in social impact
            </p>
          </div>

          {/* Controls */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <label className="text-sm font-medium text-foreground mr-2">Timeframe:</label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger className="w-48" data-testid="select-timeframe">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="semester">This Semester</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mr-2">Activity:</label>
                    <Select value={selectedActivity} onValueChange={setSelectedActivity}>
                      <SelectTrigger className="w-64" data-testid="select-activity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activities</SelectItem>
                        {opportunities?.opportunities.map((opportunity) => (
                          <SelectItem key={opportunity.id} value={opportunity.id}>
                            {opportunity.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setShowAnonymized(!showAnonymized)}
                  data-testid="button-toggle-anonymize"
                >
                  <i className="fas fa-user-secret mr-2"></i>
                  {showAnonymized ? "Show Names" : "Anonymize All"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Current User Rank */}
          {currentUser && currentUserRank > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getBadgeColor(currentUserRank)}`}>
                      {currentUserRank <= 3 ? (
                        <i className={`fas ${currentUserRank === 1 ? 'fa-crown' : 'fa-medal'}`}></i>
                      ) : (
                        currentUserRank
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Your Rank</h3>
                      <p className="text-muted-foreground">
                        #{currentUserRank} out of {leaderboard?.length || 0} students
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-2xl font-bold text-primary">
                      <div className="coin-icon">₹</div>
                      <span data-testid="text-current-user-coins">{currentUser.coins}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentUser._count?.completedApplications || 0} completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 3 Podium */}
          {!isLoading && leaderboard && leaderboard.length >= 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Second Place */}
                  <div className="text-center order-1 md:order-1">
                    <div className="w-16 h-16 bg-gray-400 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2 border-4 border-gray-400">
                      2
                    </div>
                    <h3 className="font-semibold text-foreground" data-testid="text-second-place-name">
                      {showAnonymized ? formatUserName(leaderboard[1], 1) : `${leaderboard[1].firstName} ${leaderboard[1].lastName}`}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-second-place-coins">
                      {leaderboard[1].coins} coins
                    </p>
                  </div>

                  {/* First Place */}
                  <div className="text-center order-2 md:order-2">
                    <div className="w-20 h-20 bg-yellow-500 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-2 border-4 border-yellow-500">
                      <i className="fas fa-crown"></i>
                    </div>
                    <h3 className="font-bold text-foreground text-lg" data-testid="text-first-place-name">
                      {showAnonymized ? formatUserName(leaderboard[0], 0) : `${leaderboard[0].firstName} ${leaderboard[0].lastName}`}
                    </h3>
                    <p className="text-muted-foreground" data-testid="text-first-place-coins">
                      {leaderboard[0].coins} coins
                    </p>
                  </div>

                  {/* Third Place */}
                  <div className="text-center order-3 md:order-3">
                    <div className="w-16 h-16 bg-amber-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-2 border-4 border-amber-600">
                      3
                    </div>
                    <h3 className="font-semibold text-foreground" data-testid="text-third-place-name">
                      {showAnonymized ? formatUserName(leaderboard[2], 2) : `${leaderboard[2].firstName} ${leaderboard[2].lastName}`}
                    </h3>
                    <p className="text-sm text-muted-foreground" data-testid="text-third-place-coins">
                      {leaderboard[2].coins} coins
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Leaderboard Table */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Rankings</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : leaderboard?.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-users text-muted-foreground text-xl"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Rankings Available</h3>
                  <p className="text-muted-foreground">
                    Be the first to earn coins and appear on the leaderboard!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border">
                      <tr className="text-left">
                        <th className="py-3 text-muted-foreground font-medium">Rank</th>
                        <th className="py-3 text-muted-foreground font-medium">Student</th>
                        <th className="py-3 text-muted-foreground font-medium">Coins</th>
                        <th className="py-3 text-muted-foreground font-medium">Completed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard?.map((leaderboardUser, index) => {
                        const isCurrentUser = leaderboardUser.id === user?.id;
                        return (
                          <tr
                            key={leaderboardUser.id}
                            className={`border-b border-border/50 ${
                              isCurrentUser ? "bg-primary/5 border-primary/20" : ""
                            }`}
                            data-testid={`leaderboard-row-${index}`}
                          >
                            <td className="py-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${getBadgeColor(index + 1)}`}>
                                {index + 1 <= 3 && index + 1 === 1 ? (
                                  <i className="fas fa-crown"></i>
                                ) : (
                                  index + 1
                                )}
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center text-sm font-bold">
                                  {getInitials(leaderboardUser)}
                                </div>
                                <div>
                                  <span className="font-medium text-foreground">
                                    {showAnonymized ? formatUserName(leaderboardUser, index) : `${leaderboardUser.firstName} ${leaderboardUser.lastName}`}
                                    {isCurrentUser && (
                                      <Badge variant="secondary" className="ml-2">You</Badge>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center space-x-1">
                                <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                                <span className="font-semibold text-foreground" data-testid={`coins-${index}`}>
                                  {leaderboardUser.coins}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 text-muted-foreground">
                              {leaderboardUser._count?.completedApplications || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
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
