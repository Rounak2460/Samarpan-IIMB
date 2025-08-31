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

  const { data: opportunitiesData, isLoading } = useQuery<{opportunities: OpportunityWithCreator[], total: number}>({
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-6 py-8">
        {/* Hero Section */}
        <section className="text-center py-16 bg-gradient-to-br from-red-50 via-white to-amber-50 rounded-3xl mb-12 border border-red-100 shadow-lg">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Discover Your Next
                <span className="block bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent">
                  Social Impact
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Explore curated volunteer opportunities designed for IIM Bangalore students. Make meaningful contributions to society while building your leadership profile and earning recognition.
              </p>
            </div>
            
            {/* Global Search */}
            <div className="max-w-2xl mx-auto">
              <div className="relative group">
                <Input
                  type="text"
                  placeholder="Search opportunities by title, type, or organization..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-14 pr-4 py-4 text-lg rounded-xl border-2 border-gray-200 focus:border-red-400 focus:ring-0 shadow-sm group-hover:border-red-300 transition-all duration-300"
                  data-testid="input-search"
                />
                <svg className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-red-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Search Stats */}
              <div className="flex items-center justify-center space-x-8 mt-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>150+ Active Opportunities</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V7h10v2z"/>
                  </svg>
                  <span>75+ Partner Organizations</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Enhanced Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <FiltersSidebar
                filters={filters}
                onFiltersChange={handleFilterChange}
                onClearFilters={clearFilters}
              />
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <LeaderboardSidebar />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Enhanced Header */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900" data-testid="text-results-count">
                    {opportunities.length} of {totalOpportunities} Opportunities
                  </p>
                  <p className="text-sm text-gray-600">
                    Find your perfect social impact opportunity
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-60 bg-gray-50 border-gray-200 hover:border-red-300 transition-colors duration-300" data-testid="select-sort">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">📅 Newest First</SelectItem>
                      <SelectItem value="ending-soon">⏰ Ending Soon</SelectItem>
                      <SelectItem value="most-applied">🔥 Most Popular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Opportunities Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="opportunity-card enterprise-skeleton overflow-hidden animate-pulse">
                    <div className="h-32 w-full bg-gradient-to-r from-gray-100 to-gray-200"></div>
                    <div className="p-6 space-y-4">
                      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-gray-150 to-gray-250 rounded w-full"></div>
                        <div className="h-4 bg-gradient-to-r from-gray-150 to-gray-250 rounded w-2/3"></div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-gradient-to-r from-red-100 to-red-200 rounded-full w-20"></div>
                        <div className="h-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full w-16"></div>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-20"></div>
                        <div className="flex items-center space-x-2">
                          <div className="h-4 bg-gradient-to-r from-amber-100 to-amber-200 rounded w-16"></div>
                          <div className="h-8 bg-gradient-to-r from-red-200 to-red-300 rounded-lg w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">No Opportunities Found</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  We couldn't find any opportunities matching your criteria. Try adjusting your filters or search terms to discover more ways to make an impact.
                </p>
                <Button 
                  variant="outline" 
                  onClick={clearFilters} 
                  className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300 px-6 py-3 rounded-xl"
                  data-testid="button-clear-filters"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {opportunities.map((opportunity: OpportunityWithCreator, index) => (
                  <div 
                    key={opportunity.id} 
                    className="enterprise-fade-in" 
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <OpportunityCard opportunity={opportunity} />
                  </div>
                ))}
              </div>
            )}

            {/* Enhanced Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                  <div className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {totalOpportunities} total opportunities
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="outline"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="bg-gray-50 border-gray-200 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50"
                      data-testid="button-prev-page"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </Button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className={currentPage === page 
                              ? "bg-gradient-to-r from-red-600 to-red-700 text-white border-0 w-10 h-10 rounded-xl font-semibold" 
                              : "bg-gray-50 border-gray-200 hover:bg-red-50 hover:border-red-300 w-10 h-10 rounded-xl transition-all duration-300"
                            }
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
                      className="bg-gray-50 border-gray-200 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50"
                      data-testid="button-next-page"
                    >
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
