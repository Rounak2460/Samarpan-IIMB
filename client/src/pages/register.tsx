import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import iimbLogo from "@assets/IIM_Bangalore_Logo.svg_1756641864794.png";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    firstName: "", 
    lastName: "",
    role: "",
    program: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Registration Successful!",
          description: `Account created for ${formData.firstName}. Password: ${data.tempPassword}`,
        });
        setLocation("/login");
      } else {
        toast({
          title: "Registration Failed",
          description: data.message || "Unable to create account",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Connection Error",
        description: "Unable to connect to server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img src={iimbLogo} alt="IIM Bangalore" className="w-12 h-12 object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IIMB Samarpan</h1>
              <p className="text-gray-600 text-sm">Social Impact Platform</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Impact Community</h2>
          <p className="text-gray-600">Create your institutional account</p>
        </div>

        {/* Registration Form */}
        <Card className="bg-white shadow-xl border-0 rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-700 text-white text-center">
            <CardTitle className="text-xl">New Account Registration</CardTitle>
            <CardDescription className="text-red-100">
              Join IIMB's social impact initiatives
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                    required
                    className="border-2 border-gray-200 rounded-xl h-12 focus:border-red-500 focus:ring-red-500"
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    required
                    className="border-2 border-gray-200 rounded-xl h-12 focus:border-red-500 focus:ring-red-500"
                    data-testid="input-last-name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Institutional Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.name@iimb.ac.in"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="border-2 border-gray-200 rounded-xl h-12 focus:border-red-500 focus:ring-red-500"
                  data-testid="input-email"
                />
                <p className="text-xs text-gray-500">
                  Only @iimb.ac.in email addresses are accepted
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="program" className="text-gray-700 font-medium">
                  Program
                </Label>
                <Select 
                  value={formData.program} 
                  onValueChange={(value) => setFormData({...formData, program: value})}
                >
                  <SelectTrigger className="border-2 border-gray-200 rounded-xl h-12" data-testid="select-program">
                    <SelectValue placeholder="Select your program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PGP">PGP (Post Graduate Programme)</SelectItem>
                    <SelectItem value="PGPBA">PGPBA (Business Analytics)</SelectItem>
                    <SelectItem value="Executive">Executive Programme</SelectItem>
                    <SelectItem value="PhD">PhD Programme</SelectItem>
                    <SelectItem value="Faculty">Faculty</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-700 font-medium">
                  Account Type
                </Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData({...formData, role: value})}
                >
                  <SelectTrigger className="border-2 border-gray-200 rounded-xl h-12" data-testid="select-role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student - Participate in opportunities</SelectItem>
                    <SelectItem value="admin">Administrator - Manage platform & opportunities</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Role is auto-detected from email but can be manually selected
                </p>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-register"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                Already have an account?{" "}
                <Link href="/login" className="text-red-600 hover:text-red-700 font-semibold">
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Information */}
            <div className="mt-8 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
              <h4 className="font-semibold text-amber-900 mb-2 text-sm">Account Benefits</h4>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>• Access to exclusive social impact opportunities</li>
                <li>• Earn coins for community service participation</li>
                <li>• Track your social impact contributions</li>
                <li>• Connect with like-minded changemakers</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            © 2024 IIM Bangalore - Empowering Social Change
          </p>
        </div>
      </div>
    </div>
  );
}