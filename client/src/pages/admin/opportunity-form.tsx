import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOpportunitySchema } from "@shared/schema";
import { z } from "zod";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = insertOpportunitySchema.extend({
  skills: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

const availableSkills = [
  "Maths", "English", "Computers", "Arts", "Science", "Languages",
  "Music", "Sports", "Communication", "Leadership", "Writing", "Research"
];

export default function OpportunityForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id && id !== "new";
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

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

  const { data: opportunity, isLoading: opportunityLoading } = useQuery({
    queryKey: ["/api/opportunities", id],
    enabled: isEditing && !!user && user.role === "admin",
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      shortDescription: "",
      fullDescription: "",
      type: "teaching",
      duration: "1week",
      customDuration: "",
      skills: [],
      location: "",
      schedule: "",
      capacity: undefined,
      status: "open",
      coinsReward: 1,
      visibility: "public",
      contactEmail: "",
      contactPhone: "",
      imageUrl: "",
      createdBy: user?.id || "",
    },
  });

  // Update form when opportunity data loads
  useEffect(() => {
    if (opportunity && isEditing) {
      form.reset({
        title: opportunity.title,
        shortDescription: opportunity.shortDescription,
        fullDescription: opportunity.fullDescription,
        type: opportunity.type,
        duration: opportunity.duration,
        customDuration: opportunity.customDuration || "",
        skills: opportunity.skills || [],
        location: opportunity.location || "",
        schedule: opportunity.schedule || "",
        capacity: opportunity.capacity || undefined,
        status: opportunity.status,
        coinsReward: opportunity.coinsReward,
        visibility: opportunity.visibility || "public",
        contactEmail: opportunity.contactEmail || "",
        contactPhone: opportunity.contactPhone || "",
        imageUrl: opportunity.imageUrl || "",
        createdBy: opportunity.createdBy,
      });
      setSelectedSkills(opportunity.skills || []);
    }
  }, [opportunity, isEditing, form]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, skills: selectedSkills };
      await apiRequest("POST", "/api/opportunities", payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Opportunity created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      window.location.href = "/admin/opportunities";
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create opportunity",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = { ...data, skills: selectedSkills };
      await apiRequest("PUT", `/api/opportunities/${id}`, payload);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Opportunity updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      window.location.href = "/admin/opportunities";
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update opportunity",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = selectedSkills.includes(skill)
      ? selectedSkills.filter(s => s !== skill)
      : [...selectedSkills, skill];
    setSelectedSkills(newSkills);
  };

  if (authLoading || (isEditing && opportunityLoading)) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {isEditing ? "Edit Opportunity" : "Create New Opportunity"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditing ? "Update the opportunity details" : "Fill out the form to create a new volunteering opportunity"}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter opportunity title"
                                data-testid="input-title"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shortDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description for the opportunity card"
                                className="resize-none"
                                rows={2}
                                maxLength={160}
                                data-testid="textarea-short-description"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {field.value?.length || 0}/160 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="fullDescription"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Description *</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Detailed description of the opportunity, tasks, and expectations"
                                className="resize-none"
                                rows={6}
                                data-testid="textarea-full-description"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="teaching">Teaching</SelectItem>
                                  <SelectItem value="donation">Donation</SelectItem>
                                  <SelectItem value="mentoring">Mentoring</SelectItem>
                                  <SelectItem value="community_service">Community Service</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duration *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-duration">
                                    <SelectValue placeholder="Select duration" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="instant">Instant</SelectItem>
                                  <SelectItem value="1-3days">1-3 days</SelectItem>
                                  <SelectItem value="1week">1 week</SelectItem>
                                  <SelectItem value="2-4weeks">2-4 weeks</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch("duration") === "custom" && (
                        <FormField
                          control={form.control}
                          name="customDuration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Custom Duration</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., 3 hours/week for 6 weeks"
                                  data-testid="input-custom-duration"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div>
                        <Label>Required Skills</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {availableSkills.map((skill) => (
                            <Badge
                              key={skill}
                              variant={selectedSkills.includes(skill) ? "default" : "outline"}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => handleSkillToggle(skill)}
                              data-testid={`badge-skill-${skill.toLowerCase()}`}
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        {selectedSkills.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Selected: {selectedSkills.join(", ")}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Details & Logistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., IIM Bangalore Campus"
                                  data-testid="input-location"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="schedule"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Schedule</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Weekends 2-4 PM"
                                  data-testid="input-schedule"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="capacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Capacity</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Max participants"
                                  data-testid="input-capacity"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                />
                              </FormControl>
                              <FormDescription>
                                Leave empty for unlimited capacity
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="coinsReward"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Coins Reward *</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  placeholder="Number of coins"
                                  data-testid="input-coins-reward"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Email</FormLabel>
                              <FormControl>
                                <Input
                                  type="email"
                                  placeholder="contact@example.com"
                                  data-testid="input-contact-email"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Contact Phone</FormLabel>
                              <FormControl>
                                <Input
                                  type="tel"
                                  placeholder="+91 98765 43210"
                                  data-testid="input-contact-phone"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL</FormLabel>
                            <FormControl>
                              <Input
                                type="url"
                                placeholder="https://example.com/image.jpg"
                                data-testid="input-image-url"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Optional image to display with the opportunity
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Publishing Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                                <SelectItem value="filled">Filled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="visibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Visibility</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-visibility">
                                  <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Private (Link Only)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  {/* Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Preview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                        <h4 className="font-semibold text-foreground">
                          {form.watch("title") || "Opportunity Title"}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {form.watch("shortDescription") || "Short description will appear here"}
                        </p>
                        <div className="flex items-center space-x-1 text-primary">
                          <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                          <span className="text-sm font-medium">
                            {form.watch("coinsReward") || 1}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={isSubmitting}
                          data-testid="button-submit"
                        >
                          {isSubmitting ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              {isEditing ? "Updating..." : "Creating..."}
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save mr-2"></i>
                              {isEditing ? "Update Opportunity" : "Create Opportunity"}
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => window.location.href = "/admin/opportunities"}
                          disabled={isSubmitting}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
