import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import type { ApplicationWithDetails, Badge as BadgeType } from "@shared/schema";

export default function Profile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  const { data: applications, isLoading: applicationsLoading } = useQuery<ApplicationWithDetails[]>({
    queryKey: ["/api/applications/user", user?.id],
    enabled: !!user?.id,
    retry: false,
  });

  const { data: badges, isLoading: badgesLoading } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges/user", user?.id],
    enabled: !!user?.id,
  });

  const { data: allBadges } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userRank = leaderboard?.findIndex((u: any) => u.id === user.id) + 1 || 0;
  const completedApplications = applications?.filter(app => app.status === "completed") || [];
  const totalCoinsEarned = completedApplications.reduce((sum, app) => sum + (app.coinsAwarded || 0), 0);

  // Calculate progress to next badge
  const nextBadge = allBadges?.find(badge => 
    badge.coinsRequired > (user.coins || 0) && 
    !badges?.some(userBadge => userBadge.id === badge.id)
  );
  
  const progressPercentage = nextBadge 
    ? ((user.coins || 0) / nextBadge.coinsRequired) * 100 
    : 100;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "accepted": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "gold": return "bg-gradient-to-br from-yellow-400 to-yellow-600";
      case "silver": return "bg-gradient-to-br from-gray-300 to-gray-500";
      case "bronze": return "bg-gradient-to-br from-amber-600 to-amber-800";
      default: return "bg-gradient-to-br from-primary to-primary/80";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center space-x-6 mb-8">
                <div className="w-20 h-20 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground" data-testid="text-user-name">
                    {user.firstName} {user.lastName}
                  </h1>
                  <p className="text-muted-foreground" data-testid="text-user-program">
                    {user.program || "IIM Bangalore Student"}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <div className="coin-icon">₹</div>
                      <span className="font-semibold" data-testid="text-user-coins">{user.coins || 0}</span>
                      <span className="text-sm text-muted-foreground">coins</span>
                    </div>
                    {userRank > 0 && (
                      <div className="flex items-center space-x-1">
                        <i className="fas fa-trophy text-yellow-500"></i>
                        <span className="text-sm font-medium" data-testid="text-user-rank">
                          Rank #{userRank}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress to next badge */}
              {nextBadge && (
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Progress to {nextBadge.name}
                    </span>
                    <span className="text-sm text-muted-foreground" data-testid="text-progress">
                      {user.coins || 0}/{nextBadge.coinsRequired} coins
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Tabs */}
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity" data-testid="tab-activity">Activity</TabsTrigger>
              <TabsTrigger value="badges" data-testid="tab-badges">Badges</TabsTrigger>
              <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
            </TabsList>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>My Applications</CardTitle>
                </CardHeader>
                <CardContent>
                  {applicationsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      ))}
                    </div>
                  ) : applications?.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-clipboard-list text-muted-foreground text-xl"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Yet</h3>
                      <p className="text-muted-foreground">
                        Start exploring opportunities to make your first application!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {applications?.map((application) => (
                        <div
                          key={application.id}
                          className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                          data-testid={`application-${application.id}`}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {application.opportunity?.title}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Applied on {application.appliedAt ? format(new Date(application.appliedAt), "MMM dd, yyyy") : "Unknown"}
                              {application.completedAt && (
                                <> • Completed on {format(new Date(application.completedAt), "MMM dd, yyyy")}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge className={getStatusColor(application.status)}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                            {application.coinsAwarded > 0 && (
                              <div className="flex items-center space-x-1">
                                <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                                <span className="text-sm font-medium">+{application.coinsAwarded}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Badges Tab */}
            <TabsContent value="badges">
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  {badgesLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {allBadges?.map((badge) => {
                        const isEarned = badges?.some(userBadge => userBadge.id === badge.id);
                        return (
                          <div
                            key={badge.id}
                            className={`text-center p-4 rounded-lg border ${
                              isEarned 
                                ? "bg-primary/5 border-primary/20" 
                                : "bg-muted/50 border-border opacity-50"
                            }`}
                            data-testid={`badge-${badge.id}`}
                          >
                            <div
                              className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold ${
                                isEarned 
                                  ? getBadgeColor(badge.type || "default")
                                  : "bg-muted"
                              }`}
                            >
                              {badge.icon || badge.name?.[0]}
                            </div>
                            <h4 className="font-medium text-sm text-foreground">{badge.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {badge.coinsRequired} coins
                            </p>
                            {badge.description && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {badge.description}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Profile Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-muted-foreground">Email</label>
                        <p className="text-foreground">{user.email}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Name</label>
                        <p className="text-foreground">{user.firstName} {user.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm text-muted-foreground">Program</label>
                        <p className="text-foreground">{user.program || "Not specified"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Privacy Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-foreground">
                            Anonymize on Leaderboard
                          </label>
                          <p className="text-xs text-muted-foreground">
                            Hide your name and show as "Anonymous" on the leaderboard
                          </p>
                        </div>
                        <Button variant="outline" size="sm" data-testid="button-toggle-anonymize">
                          {user.anonymizeLeaderboard ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-foreground mb-2">Account Actions</h4>
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/api/logout'}
                        data-testid="button-logout"
                      >
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Logout
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
