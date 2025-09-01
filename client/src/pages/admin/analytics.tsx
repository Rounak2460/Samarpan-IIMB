import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import KPICards from "@/components/admin/kpi-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format, subDays, subMonths } from "date-fns";

interface AnalyticsData {
  totalOpportunities: number;
  totalApplications: number;
  averageApplyRate: number;
  completionRate: number;
  applicationsOverTime: Array<{ date: string; count: number }>;
  applicationsByType: Array<{ type: string; count: number }>;
}

export default function Analytics() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30");

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

  const { data: analytics, isLoading: analyticsLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", { dateRange }],
    enabled: !!user && user.role === "admin",
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

  const exportAnalytics = () => {
    if (!analytics) return;

    const csvContent = [
      ["Metric", "Value"],
      ["Total Opportunities", analytics.totalOpportunities.toString()],
      ["Total Applications", analytics.totalApplications.toString()],
      ["Average Apply Rate", `${analytics.averageApplyRate.toFixed(2)}%`],
      ["Completion Rate", `${analytics.completionRate.toFixed(2)}%`],
      [""],
      ["Applications Over Time"],
      ["Date", "Applications"],
      ...analytics.applicationsOverTime.map(item => [
        item.date,
        item.count.toString()
      ]),
      [""],
      ["Applications by Type"],
      ["Type", "Count"],
      ...analytics.applicationsByType.map(item => [
        item.type,
        item.count.toString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `samarpan-analytics-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getDateRangeLabel = (range: string) => {
    switch (range) {
      case "7": return "Last 7 days";
      case "30": return "Last 30 days";
      case "90": return "Last 3 months";
      case "365": return "Last year";
      default: return "Last 30 days";
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case "teaching": return "Teaching";
      case "donation": return "Donation";
      case "mentoring": return "Mentoring";
      case "community_service": return "Community Service";
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getTypeColor = (type: string, index: number) => {
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))"
    ];
    
    switch (type) {
      case "teaching": return colors[0];
      case "donation": return colors[1];
      case "mentoring": return colors[2];
      case "community_service": return colors[3];
      default: return colors[index % colors.length];
    }
  };

  const maxApplicationsInDay = Math.max(...(analytics?.applicationsOverTime.map(item => item.count) || [0]));
  const totalApplicationsByType = analytics?.applicationsByType.reduce((sum, item) => sum + item.count, 0) || 1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Comprehensive insights into platform usage and engagement
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48" data-testid="select-date-range">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 3 months</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                onClick={exportAnalytics}
                disabled={!analytics}
                data-testid="button-export-analytics"
              >
                <i className="fas fa-download mr-2"></i>
                Export Data
              </Button>
            </div>
          </div>

          {/* KPI Cards */}
          <KPICards analytics={analytics} isLoading={analyticsLoading} />

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Applications Over Time */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Applications Over Time</CardTitle>
                  <Badge variant="secondary" data-testid="badge-time-range">
                    {getDateRangeLabel(dateRange)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end h-64">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="w-8 h-32" />
                      ))}
                    </div>
                    <div className="flex justify-between">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="w-12 h-4" />
                      ))}
                    </div>
                  </div>
                ) : analytics?.applicationsOverTime.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <i className="fas fa-chart-line text-4xl mb-2"></i>
                      <p>No application data available</p>
                      <p className="text-sm">for the selected time period</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Simple Bar Chart */}
                    <div className="h-64 flex items-end justify-between space-x-1" data-testid="chart-applications-time">
                      {analytics?.applicationsOverTime.slice(-14).map((item, index) => {
                        const height = maxApplicationsInDay > 0 ? (item.count / maxApplicationsInDay) * 100 : 0;
                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div
                              className="bg-primary rounded-t-sm min-h-[4px] w-full transition-all duration-300 hover:opacity-80"
                              style={{ height: `${Math.max(height, 4)}%` }}
                              title={`${format(new Date(item.date), "MMM dd")}: ${item.count} applications`}
                              data-testid={`bar-${index}`}
                            ></div>
                            <div className="text-xs text-muted-foreground mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                              {format(new Date(item.date), "MM/dd")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Chart Legend */}
                    <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-primary rounded"></div>
                        <span>Applications per day</span>
                      </div>
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground" data-testid="text-total-period-applications">
                          {analytics?.applicationsOverTime.reduce((sum, item) => sum + item.count, 0) || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Total Applications</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground" data-testid="text-avg-daily-applications">
                          {analytics?.applicationsOverTime.length 
                            ? Math.round((analytics.applicationsOverTime.reduce((sum, item) => sum + item.count, 0) || 0) / analytics.applicationsOverTime.length)
                            : 0
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">Avg. per Day</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-foreground" data-testid="text-peak-day-applications">
                          {maxApplicationsInDay}
                        </p>
                        <p className="text-sm text-muted-foreground">Peak Day</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Applications by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Applications by Opportunity Type</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Skeleton className="w-48 h-48 rounded-full" />
                    </div>
                    <div className="space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Skeleton className="w-4 h-4 rounded" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="w-12 h-4" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : analytics?.applicationsByType.length === 0 ? (
                  <div className="h-64 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <i className="fas fa-chart-pie text-4xl mb-2"></i>
                      <p>No application data available</p>
                      <p className="text-sm">by opportunity type</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Simple Horizontal Bar Chart */}
                    <div className="space-y-4" data-testid="chart-applications-type">
                      {analytics?.applicationsByType.map((item, index) => {
                        const percentage = (item.count / totalApplicationsByType) * 100;
                        const color = getTypeColor(item.type, index);
                        
                        return (
                          <div key={item.type} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: color }}
                                ></div>
                                <span className="text-sm font-medium text-foreground">
                                  {getTypeDisplayName(item.type)}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">
                                  {percentage.toFixed(1)}%
                                </span>
                                <span className="text-sm font-semibold text-foreground" data-testid={`count-${item.type}`}>
                                  {item.count}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: color
                                }}
                                data-testid={`bar-${item.type}`}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Type Summary */}
                    <div className="pt-4 border-t border-border">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground" data-testid="text-most-popular-type">
                            {analytics?.applicationsByType.length > 0 
                              ? getTypeDisplayName(analytics.applicationsByType[0].type)
                              : "N/A"
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">Most Popular</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-foreground" data-testid="text-type-diversity">
                            {analytics?.applicationsByType.length || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">Active Types</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detailed Insights */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Engagement Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Apply Rate</p>
                        <p className="text-xs text-muted-foreground">Applications per opportunity</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary" data-testid="text-detailed-apply-rate">
                          {analytics?.averageApplyRate.toFixed(1) || "0"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Completion Rate</p>
                        <p className="text-xs text-muted-foreground">Completed vs applied</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-chart-2" data-testid="text-detailed-completion-rate">
                          {analytics?.completionRate.toFixed(1) || "0"}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Avg. Daily Applications</p>
                        <p className="text-xs text-muted-foreground">Based on selected period</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-chart-3" data-testid="text-avg-daily-detailed">
                          {analytics?.applicationsOverTime.length 
                            ? Math.round((analytics.applicationsOverTime.reduce((sum, item) => sum + item.count, 0) || 0) / analytics.applicationsOverTime.length)
                            : 0
                          }
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">Active Opportunities</p>
                        <p className="text-xs text-muted-foreground">Currently accepting applications</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-chart-4" data-testid="text-active-opportunities">
                          {analytics?.totalOpportunities || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-green-600 dark:text-green-400 mb-2">
                        <i className="fas fa-arrow-up text-xl"></i>
                      </div>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">Strong Engagement</p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {analytics?.completionRate && analytics.completionRate > 80 
                          ? "High completion rate indicates quality opportunities"
                          : "Opportunities are attracting student interest"
                        }
                      </p>
                    </div>

                    {analytics?.applicationsByType.length && analytics.applicationsByType.length > 1 && (
                      <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-blue-600 dark:text-blue-400 mb-2">
                          <i className="fas fa-users text-xl"></i>
                        </div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Diverse Participation</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          Students engaged across {analytics.applicationsByType.length} different opportunity types
                        </p>
                      </div>
                    )}

                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="text-purple-600 dark:text-purple-400 mb-2">
                        <i className="fas fa-trophy text-xl"></i>
                      </div>
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Impact Generated</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">
                        Platform facilitating meaningful social contributions
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/admin/opportunities/new"}
                    data-testid="button-quick-create-opportunity"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create New Opportunity
                  </Button>


                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={exportAnalytics}
                    disabled={!analytics}
                    data-testid="button-quick-export"
                  >
                    <i className="fas fa-download mr-2"></i>
                    Export Analytics
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.location.href = "/leaderboard"}
                    data-testid="button-quick-leaderboard"
                  >
                    <i className="fas fa-trophy mr-2"></i>
                    View Leaderboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Insights Footer */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">Data Insights Summary</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Analytics data is updated in real-time and reflects all platform activity for the selected time period.
                </p>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground" data-testid="text-summary-opportunities">
                      {analytics?.totalOpportunities || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Opportunities</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground" data-testid="text-summary-applications">
                      {analytics?.totalApplications || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Applications</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground" data-testid="text-summary-completion">
                      {analytics?.completionRate.toFixed(1) || "0"}%
                    </p>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground" data-testid="text-summary-engagement">
                      {analytics?.averageApplyRate.toFixed(1) || "0"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Apply Rate</p>
                  </div>
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
