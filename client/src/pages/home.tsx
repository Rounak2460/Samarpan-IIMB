import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import OpportunityCard from "@/components/opportunity-card";
import FiltersSidebar from "@/components/filters-sidebar";
import LeaderboardSidebar from "@/components/leaderboard-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { OpportunityWithCreator } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    type: [] as string[],
    duration: [] as string[],
    skills: [] as string[],
  });
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data: opportunitiesData, isLoading } = useQuery({
    queryKey: ["/api/opportunities", {
      search: searchQuery,
      ...filters,
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    }],
  });

  const opportunities = opportunitiesData?.opportunities || [];
  const totalOpportunities = opportunitiesData?.total || 0;
  const totalPages = Math.ceil(totalOpportunities / pageSize);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({ type: [], duration: [], skills: [] });
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center py-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Find Ways to <span className="text-primary">Contribute</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover meaningful social work opportunities within and around IIM Bangalore. Make a difference while earning coins and badges.
          </p>
          
          {/* Global Search */}
          <div className="max-w-md mx-auto relative">
            <Input
              type="text"
              placeholder="Search opportunities..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-12"
              data-testid="input-search"
            />
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          </div>
        </section>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <FiltersSidebar
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClearFilters={clearFilters}
            />
            <LeaderboardSidebar />
          </aside>

          {/* Opportunities Grid */}
          <div className="lg:col-span-3">
            {/* Sorting and Results Info */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground" data-testid="text-results-count">
                Showing {opportunities.length} of {totalOpportunities} opportunities
              </p>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48" data-testid="select-sort">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Sort by: Newest</SelectItem>
                  <SelectItem value="ending-soon">Sort by: Ending Soon</SelectItem>
                  <SelectItem value="most-applied">Sort by: Most Applied</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Opportunities Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-muted-foreground text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No opportunities found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {opportunities.map((opportunity: OpportunityWithCreator) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  data-testid="button-prev-page"
                >
                  <i className="fas fa-chevron-left mr-1"></i>Previous
                </Button>
                
                <div className="flex space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        data-testid={`button-page-${page}`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  data-testid="button-next-page"
                >
                  Next<i className="fas fa-chevron-right ml-1"></i>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
