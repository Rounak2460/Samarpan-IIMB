import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { UserWithStats } from "@shared/schema";

export default function LeaderboardSidebar() {
  const { user } = useAuth();

  const { data: leaderboard, isLoading } = useQuery<UserWithStats[]>({
    queryKey: ["/api/leaderboard", { limit: 5 }],
  });

  const currentUserRank = leaderboard?.findIndex(u => u.id === user?.id) + 1 || 0;

  const formatUserName = (leaderboardUser: UserWithStats) => {
    if (leaderboardUser.anonymizeLeaderboard && leaderboardUser.id !== user?.id) {
      return "Anonymous";
    }
    return `${leaderboardUser.firstName} ${leaderboardUser.lastName}`;
  };

  const getInitials = (leaderboardUser: UserWithStats) => {
    if (leaderboardUser.anonymizeLeaderboard && leaderboardUser.id !== user?.id) {
      return "??";
    }
    return `${leaderboardUser.firstName?.[0] || ""}${leaderboardUser.lastName?.[0] || ""}`;
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Leaderboard</CardTitle>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" data-testid="button-view-full-leaderboard">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {/* Current User Rank */}
        {user && currentUserRank > 0 && (
          <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  {currentUserRank}
                </div>
                <span className="text-sm font-medium text-foreground">Your Rank</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                <span className="text-sm font-semibold" data-testid="text-current-user-coins">
                  {user.coins || 0}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top Users */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-6 h-6 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-2 w-16" />
                </div>
                <Skeleton className="w-4 h-4" />
              </div>
            ))}
          </div>
        ) : leaderboard?.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No rankings available yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard?.slice(0, 5).map((leaderboardUser, index) => {
              const isCurrentUser = leaderboardUser.id === user?.id;
              return (
                <div
                  key={leaderboardUser.id}
                  className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                    isCurrentUser 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/50"
                  }`}
                  data-testid={`leaderboard-item-${index}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? "bg-yellow-500" : 
                    index === 1 ? "bg-gray-400" : 
                    index === 2 ? "bg-amber-600" : "bg-primary"
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {formatUserName(leaderboardUser)}
                      {isCurrentUser && <span className="text-primary"> (You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`coins-${index}`}>
                      {leaderboardUser.coins} coins
                    </p>
                  </div>
                  <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                </div>
              );
            })}
          </div>
        )}

        {leaderboard && leaderboard.length > 5 && (
          <div className="mt-4 text-center">
            <Link href="/leaderboard">
              <Button variant="outline" size="sm" data-testid="button-see-more-leaderboard">
                See More
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
