import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface KPICardsProps {
  analytics?: {
    totalOpportunities: number;
    totalApplications: number;
    averageApplyRate: number;
    completionRate: number;
  };
  isLoading: boolean;
}

export default function KPICards({ analytics, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-16" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const kpiData = [
    {
      title: "Active Opportunities",
      value: analytics?.totalOpportunities || 0,
      icon: "fas fa-clipboard-list",
      iconColor: "text-primary",
      bgColor: "bg-primary/10",
      change: "+12%",
      changeType: "positive",
      testId: "kpi-opportunities",
    },
    {
      title: "Total Applications",
      value: analytics?.totalApplications || 0,
      icon: "fas fa-users",
      iconColor: "text-chart-1",
      bgColor: "bg-chart-1/10",
      change: "+28%",
      changeType: "positive",
      testId: "kpi-applications",
    },
    {
      title: "Apply Rate",
      value: `${(analytics?.averageApplyRate || 0).toFixed(1)}`,
      suffix: "%",
      icon: "fas fa-chart-line",
      iconColor: "text-chart-2",
      bgColor: "bg-chart-2/10",
      change: "-3.2%",
      changeType: "negative",
      testId: "kpi-apply-rate",
    },
    {
      title: "Completion Rate",
      value: `${(analytics?.completionRate || 0).toFixed(1)}`,
      suffix: "%",
      icon: "fas fa-check-circle",
      iconColor: "text-chart-3",
      bgColor: "bg-chart-3/10",
      change: "+5.4%",
      changeType: "positive",
      testId: "kpi-completion-rate",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">{kpi.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1" data-testid={kpi.testId}>
                  {kpi.value}{kpi.suffix}
                </p>
              </div>
              <div className={`w-12 h-12 ${kpi.bgColor} rounded-full flex items-center justify-center`}>
                <i className={`${kpi.icon} ${kpi.iconColor} text-xl`}></i>
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <i className={`fas ${kpi.changeType === "positive" ? "fa-arrow-up text-green-500" : "fa-arrow-down text-red-500"} mr-1`}></i>
              <span className={`font-medium ${kpi.changeType === "positive" ? "text-green-500" : "text-red-500"}`}>
                {kpi.change}
              </span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
