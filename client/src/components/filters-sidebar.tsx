import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";

interface FiltersSidebarProps {
  filters: {
    type: string[];
    duration: string[];
    skills: string[];
  };
  onFiltersChange: (filters: { type: string[], duration: string[], skills: string[] }) => void;
  onClearFilters: () => void;
}

export default function FiltersSidebar({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: FiltersSidebarProps) {
  const durationOptions = [
    { value: "instant", label: "Instant" },
    { value: "1-3days", label: "1-3 days" },
    { value: "1week", label: "1 week" },
    { value: "2-4weeks", label: "2-4 weeks" },
  ];

  const typeOptions = [
    { value: "teaching", label: "Teaching" },
    { value: "donation", label: "Donation" },
    { value: "mentoring", label: "Mentoring" },
    { value: "community_service", label: "Community Service" },
  ];

  const skillOptions = [
    "Maths", "English", "Computers", "Arts", "Science", "Languages", 
    "Music", "Sports", "Communication", "Leadership"
  ];

  const handleDurationChange = (value: string) => {
    const newDuration = filters.duration.includes(value)
      ? filters.duration.filter(d => d !== value)
      : [...filters.duration, value];
    
    onFiltersChange({
      ...filters,
      duration: newDuration,
    });
  };

  const handleTypeChange = (value: string, checked: boolean) => {
    const newType = checked
      ? [...filters.type, value]
      : filters.type.filter(t => t !== value);
    
    onFiltersChange({
      ...filters,
      type: newType,
    });
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter(s => s !== skill)
      : [...filters.skills, skill];
    
    onFiltersChange({
      ...filters,
      skills: newSkills,
    });
  };

  const hasActiveFilters = filters.type.length > 0 || filters.duration.length > 0 || filters.skills.length > 0;

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" data-testid="badge-active-filters">
              {filters.type.length + filters.duration.length + filters.skills.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Duration Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">Duration</Label>
          <div className="space-y-2">
            {durationOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`duration-${option.value}`}
                  checked={filters.duration.includes(option.value)}
                  onCheckedChange={() => handleDurationChange(option.value)}
                  data-testid={`checkbox-duration-${option.value}`}
                />
                <Label
                  htmlFor={`duration-${option.value}`}
                  className="text-sm font-normal text-foreground cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Type Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">Type</Label>
          <div className="space-y-2">
            {typeOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${option.value}`}
                  checked={filters.type.includes(option.value)}
                  onCheckedChange={(checked) => handleTypeChange(option.value, checked as boolean)}
                  data-testid={`checkbox-type-${option.value}`}
                />
                <Label
                  htmlFor={`type-${option.value}`}
                  className="text-sm font-normal text-foreground cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Skills Filter */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3 block">Skills</Label>
          <div className="flex flex-wrap gap-2">
            {skillOptions.map((skill) => (
              <Badge
                key={skill}
                variant={filters.skills.includes(skill) ? "default" : "outline"}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleSkillToggle(skill)}
                data-testid={`badge-skill-${skill.toLowerCase()}`}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="w-full text-muted-foreground hover:text-primary"
            data-testid="button-clear-filters"
          >
            <i className="fas fa-times mr-2"></i>
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
