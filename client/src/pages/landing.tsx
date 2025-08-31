import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo and Brand */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
              <i className="fas fa-hands-helping text-2xl"></i>
            </div>
            <h1 className="text-4xl font-bold text-foreground">IIMB Samarpan</h1>
          </div>

          {/* Hero Content */}
          <div className="mb-12">
            <h2 className="text-5xl md:text-6xl font-bold text-foreground mb-6">
              Make a <span className="text-primary">Difference</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with meaningful social impact opportunities at IIM Bangalore. 
              Earn coins, unlock badges, and create lasting change in your community.
            </p>
            
            <Button 
              size="lg" 
              className="text-lg px-8 py-4"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Get Started
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-primary text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Discover Opportunities</h3>
                <p className="text-muted-foreground text-sm">
                  Browse and filter social work opportunities by type, duration, and skills required.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-chart-1/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-medal text-chart-1 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Earn Recognition</h3>
                <p className="text-muted-foreground text-sm">
                  Collect coins and unlock badges as you complete volunteer activities and make impact.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-chart-2/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-trophy text-chart-2 text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Compete & Lead</h3>
                <p className="text-muted-foreground text-sm">
                  Climb the leaderboard and showcase your social impact achievements to peers.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Students Engaged</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-1 mb-2">150+</div>
              <div className="text-muted-foreground">Opportunities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-2 mb-2">2000+</div>
              <div className="text-muted-foreground">Hours Contributed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-3 mb-2">50+</div>
              <div className="text-muted-foreground">NGO Partners</div>
            </div>
          </div>

          {/* CTA Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                Ready to Start Your Social Impact Journey?
              </h3>
              <p className="text-muted-foreground mb-6">
                Join hundreds of IIM Bangalore students who are already making a difference in their communities.
              </p>
              <Button 
                size="lg"
                onClick={() => window.location.href = '/api/login'}
                data-testid="button-cta-login"
              >
                <i className="fas fa-rocket mr-2"></i>
                Join Samarpan Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 IIMB Samarpan. Built with ❤️ by <strong>Vikasana</strong> - IIM Bangalore Social Impact Cell</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
