import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="mt-16 bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                <i className="fas fa-hands-helping text-sm"></i>
              </div>
              <span className="font-bold text-foreground">IIMB Samarpan</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connecting IIM Bangalore students with meaningful social impact opportunities.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-3">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" data-testid="footer-opportunities">
                  <span className="text-muted-foreground hover:text-primary transition-colors">
                    Opportunities
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" data-testid="footer-leaderboard">
                  <span className="text-muted-foreground hover:text-primary transition-colors">
                    Leaderboard
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/profile" data-testid="footer-profile">
                  <span className="text-muted-foreground hover:text-primary transition-colors">
                    Profile
                  </span>
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-3">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-contact">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-privacy">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-terms">
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold text-foreground mb-3">Connect</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-twitter">
                <i className="fab fa-twitter"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-linkedin">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors" data-testid="footer-facebook">
                <i className="fab fa-facebook"></i>
              </a>
            </div>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 IIMB Samarpan. Built with ❤️ by <strong>Rounak and Bharat (PGP/PGPBA 2026 batch)</strong> - IIM Bangalore Social Impact Cell</p>
        </div>
      </div>
    </footer>
  );
}
