import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import iimbLogo from "@assets/IIM_Bangalore_Logo.svg_1756641864794.png";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 via-transparent to-amber-500/5"></div>
        <div className="relative container mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-8">
              {/* Institution Branding */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 ring-4 ring-red-100 ring-offset-4">
                  <img 
                    src={iimbLogo} 
                    alt="IIM Bangalore" 
                    className="w-10 h-10 object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent">
                    IIMB Samarpan
                  </h1>
                  <p className="text-sm text-gray-600 font-medium tracking-wide">
                    Social Impact Platform • IIM Bangalore
                  </p>
                </div>
              </div>

              {/* Hero Headline */}
              <div className="space-y-6">
                <h2 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Transform 
                  <span className="block bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent">
                    Communities
                  </span>
                  <span className="block text-gray-700">
                    Through Impact
                  </span>
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Empowering IIM Bangalore students to create meaningful social change through curated volunteer opportunities, gamified engagement, and community recognition.
                </p>
              </div>

              {/* CTA Section */}
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-lg"
                    data-testid="button-hero-login"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Your Journey
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="px-8 py-4 rounded-xl border-2 border-gray-300 hover:border-red-300 hover:bg-red-50 transition-all duration-300 text-lg font-medium"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  data-testid="button-learn-more"
                >
                  Learn More
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 pt-6">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-white"></div>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium">500+ Active Students</span>
                </div>
                <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0 shadow-sm">
                  ⭐ Top Ranked Platform
                </Badge>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative lg:ml-8">
              <div className="relative">
                {/* Main Hero Card */}
                <Card className="bg-white shadow-2xl border-0 overflow-hidden transform rotate-3 hover:rotate-1 transition-transform duration-500">
                  <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <img src={iimbLogo} alt="IIM Bangalore" className="w-8 h-8 object-contain" />
                        <div>
                          <h3 className="font-semibold text-lg">Impact Dashboard</h3>
                          <p className="text-red-100 text-sm">Track Your Social Contribution</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700 font-medium">Total Impact Score</span>
                      <div className="flex items-center space-x-2">
                        <div className="coin-icon scale-75">₹</div>
                        <span className="text-2xl font-bold text-amber-600">1,247</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-red-500 to-amber-500 h-3 rounded-full" style={{width: '78%'}}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-red-600">12</div>
                        <div className="text-xs text-gray-500">Projects</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-600">45h</div>
                        <div className="text-xs text-gray-500">Contributed</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating Badges */}
                <div className="absolute -top-4 -right-4 floating-element">
                  <Badge className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-2 shadow-lg">
                    🏆 Top Contributor
                  </Badge>
                </div>
                <div className="absolute -bottom-4 -left-4 floating-element" style={{animationDelay: '2s'}}>
                  <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 shadow-lg">
                    ✨ Impact Leader
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Comprehensive <span className="bg-gradient-to-r from-red-600 to-amber-500 bg-clip-text text-transparent">Social Impact</span> Ecosystem
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Designed specifically for IIM Bangalore students to engage in meaningful social work through technology-enabled community impact.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white to-red-50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Discover Opportunities</h3>
                <p className="text-gray-600 leading-relaxed">
                  Explore curated social impact opportunities tailored for IIM Bangalore students. Filter by cause, duration, and skills to find your perfect match.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white to-amber-50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Earn Recognition</h3>
                <p className="text-gray-600 leading-relaxed">
                  Collect coins and unlock prestigious badges as you complete volunteer activities and achieve social impact milestones.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-gradient-to-br from-white to-green-50 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Drive Impact</h3>
                <p className="text-gray-600 leading-relaxed">
                  Lead community initiatives, track measurable outcomes, and create lasting change while building your leadership profile.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-red-700">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Measurable Impact at Scale
            </h2>
            <p className="text-red-100 text-xl max-w-2xl mx-auto">
              Join a thriving community of change-makers who are actively transforming lives and communities.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3 pulse-primary">500+</div>
              <div className="text-red-100 font-medium text-lg">Active Students</div>
              <div className="text-red-200 text-sm mt-1">Engaged in social work</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3 pulse-primary">150+</div>
              <div className="text-red-100 font-medium text-lg">Live Opportunities</div>
              <div className="text-red-200 text-sm mt-1">Available for participation</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3 pulse-primary">2,500+</div>
              <div className="text-red-100 font-medium text-lg">Impact Hours</div>
              <div className="text-red-200 text-sm mt-1">Total time contributed</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-white mb-3 pulse-primary">75+</div>
              <div className="text-red-100 font-medium text-lg">Partner NGOs</div>
              <div className="text-red-200 text-sm mt-1">Trusted collaborations</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-amber-50">
        <div className="container mx-auto px-6">
          <Card className="max-w-4xl mx-auto bg-white shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-12 text-center">
              <div className="mb-8">
                <img src={iimbLogo} alt="IIM Bangalore" className="w-16 h-16 mx-auto mb-6 object-contain" />
                <h3 className="text-4xl font-bold text-gray-900 mb-4">
                  Ready to Lead Social Change?
                </h3>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Join the prestigious community of IIM Bangalore students who are already making measurable impact in society through technology-enabled social work.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
                <Link href="/login">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-lg"
                    data-testid="button-cta-login"
                    >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Join IIMB Samarpan
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm">Trusted by 500+ students</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <img src={iimbLogo} alt="IIM Bangalore" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold">IIMB Samarpan</span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Empowering future business leaders to create meaningful social change through strategic community engagement and impact measurement.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Platform Features</h4>
              <ul className="space-y-2 text-gray-300">
                <li>• Curated Volunteer Opportunities</li>
                <li>• Gamified Engagement System</li>
                <li>• Impact Tracking & Analytics</li>
                <li>• Community Recognition</li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">About IIM Bangalore</h4>
              <p className="text-gray-300">
                India's premier business school committed to excellence in management education and social responsibility.
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              &copy; 2024 IIMB Samarpan. Developed by <strong className="text-white">Rounak and Bharat (PGP/PGPBA 2026 batch)</strong> - IIM Bangalore Social Impact Cell
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}