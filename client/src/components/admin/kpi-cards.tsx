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
          <Card key={i} className="bg-white shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-10 w-20" />
                </div>
                <Skeleton className="h-14 w-14 rounded-2xl" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
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
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      bgGradient: "from-red-500 to-red-600",
      cardGradient: "from-red-50 to-red-100",
      change: null,
      changeType: null,
      testId: "kpi-opportunities",
    },
    {
      title: "Total Applications",
      value: analytics?.totalApplications || 0,
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      bgGradient: "from-blue-500 to-blue-600",
      cardGradient: "from-blue-50 to-blue-100",
      change: null,
      changeType: null,
      testId: "kpi-applications",
    },
    {
      title: "Apply Rate",
      value: `${(analytics?.averageApplyRate || 0).toFixed(1)}`,
      suffix: "%",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      bgGradient: "from-green-500 to-green-600",
      cardGradient: "from-green-50 to-green-100",
      change: null,
      changeType: null,
      testId: "kpi-apply-rate",
    },
    {
      title: "Completion Rate",
      value: `${(analytics?.completionRate || 0).toFixed(1)}`,
      suffix: "%",
      icon: (
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      bgGradient: "from-amber-500 to-amber-600",
      cardGradient: "from-amber-50 to-amber-100",
      change: null,
      changeType: null,
      testId: "kpi-completion-rate",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi) => (
        <Card key={kpi.title} className={`bg-gradient-to-br ${kpi.cardGradient} shadow-lg border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}>
          <CardContent className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-2">
                <p className="text-gray-600 text-sm font-medium uppercase tracking-wide">{kpi.title}</p>
                <p className="text-4xl font-bold text-gray-900" data-testid={kpi.testId}>
                  {kpi.value}{kpi.suffix}
                </p>
              </div>
              <div className={`w-14 h-14 bg-gradient-to-br ${kpi.bgGradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {kpi.icon}
              </div>
            </div>
            {kpi.change && (
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm">
                  <svg className={`w-4 h-4 mr-1 ${kpi.changeType === "positive" ? "text-green-500" : "text-red-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={kpi.changeType === "positive" ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                  </svg>
                  <span className={`font-semibold ${kpi.changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
                    {kpi.change}
                  </span>
                </div>
                <span className="text-gray-500 text-xs font-medium">vs last month</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
