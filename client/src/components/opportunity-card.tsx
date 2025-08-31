import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OpportunityWithCreator } from "@shared/schema";

interface OpportunityCardProps {
  opportunity: OpportunityWithCreator;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-green-100 text-green-800";
      case "closed": return "bg-red-100 text-red-800";
      case "filled": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "teaching": return "bg-primary/10 text-primary";
      case "donation": return "bg-chart-1/10 text-chart-1";
      case "mentoring": return "bg-chart-2/10 text-chart-2";
      case "community_service": return "bg-chart-3/10 text-chart-3";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getDurationDisplay = (duration: string, customDuration?: string) => {
    if (customDuration) return customDuration;
    switch (duration) {
      case "instant": return "Instant";
      case "1-3days": return "1-3 days";
      case "1week": return "1 week";
      case "2-4weeks": return "2-4 weeks";
      default: return duration;
    }
  };

  const getDefaultImage = (type: string) => {
    switch (type) {
      case "teaching":
        return "https://images.unsplash.com/photo-1497486751825-1233686d5d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
      case "donation":
        return "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
      case "mentoring":
        return "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
      case "community_service":
        return "https://images.unsplash.com/photo-1547036967-23d11aacaee0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
      default:
        return "https://images.unsplash.com/photo-1509062522246-3755977927d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
    }
  };

  return (
    <Card className="opportunity-card bg-card rounded-xl shadow-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-0">
        {/* Image */}
        <div className="w-full h-32 overflow-hidden rounded-t-xl">
          <img
            src={opportunity.imageUrl || getDefaultImage(opportunity.type)}
            alt={opportunity.title}
            className="w-full h-full object-cover"
            data-testid="img-opportunity-card"
          />
        </div>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-foreground text-lg line-clamp-1" data-testid="text-opportunity-title">
              {opportunity.title}
            </h3>
            <Badge className={getStatusColor(opportunity.status || 'open')} data-testid="badge-opportunity-status">
              {(opportunity.status || 'open').charAt(0).toUpperCase() + (opportunity.status || 'open').slice(1)}
            </Badge>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm mb-4 line-clamp-2" data-testid="text-opportunity-description">
            {opportunity.shortDescription}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge className={getTypeColor(opportunity.type)} data-testid="badge-opportunity-type">
              {opportunity.type.replace("_", " ").toUpperCase()}
            </Badge>
            {opportunity.skills && opportunity.skills.length > 0 && (
              <Badge variant="secondary" data-testid="badge-opportunity-skill">
                {opportunity.skills[0]}
                {opportunity.skills.length > 1 && ` +${opportunity.skills.length - 1}`}
              </Badge>
            )}
            <Badge variant="outline" data-testid="badge-opportunity-duration">
              {getDurationDisplay(opportunity.duration, opportunity.customDuration || undefined)}
            </Badge>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-muted-foreground text-sm">
              <i className="fas fa-users"></i>
              <span data-testid="text-applicant-count">
                {opportunity._count?.applications || 0} applied
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-primary">
                <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                <span className="text-sm font-medium" data-testid="text-coins-reward">
                  {opportunity.coinsReward}
                </span>
              </div>
              <Link href={`/opportunity/${opportunity.id}`}>
                <Button 
                  size="sm" 
                  disabled={opportunity.status === "closed"}
                  data-testid="button-view-opportunity"
                >
                  {opportunity.status === "closed" ? "Closed" : "View"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
