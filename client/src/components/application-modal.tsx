import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import type { OpportunityWithCreator } from "@shared/schema";

interface ApplicationModalProps {
  opportunity: OpportunityWithCreator;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export default function ApplicationModal({
  opportunity,
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: ApplicationModalProps) {
  const { user } = useAuth();
  const [hasCommitment, setHasCommitment] = useState(false);

  const handleSubmit = () => {
    if (hasCommitment) {
      onSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-application">
        <DialogHeader>
          <DialogTitle>Apply to Opportunity</DialogTitle>
          <DialogDescription>
            You're about to apply for "{opportunity.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Information */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Your Information</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="font-medium text-foreground" data-testid="text-applicant-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-muted-foreground" data-testid="text-applicant-email">
                {user?.email}
              </p>
              {user?.program && (
                <p className="text-sm text-muted-foreground" data-testid="text-applicant-program">
                  {user.program}
                </p>
              )}
            </div>
          </div>

          {/* Opportunity Details */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Opportunity Details</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock text-muted-foreground"></i>
                <span className="text-sm text-foreground">
                  Duration: {opportunity.customDuration || opportunity.duration}
                </span>
              </div>
              {opportunity.schedule && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-calendar text-muted-foreground"></i>
                  <span className="text-sm text-foreground">
                    Schedule: {opportunity.schedule}
                  </span>
                </div>
              )}
              {opportunity.location && (
                <div className="flex items-center space-x-2">
                  <i className="fas fa-map-marker-alt text-muted-foreground"></i>
                  <span className="text-sm text-foreground">
                    Location: {opportunity.location}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <div className="coin-icon" style={{ width: "16px", height: "16px", fontSize: "10px" }}>₹</div>
                <span className="text-sm text-foreground">
                  Reward: {opportunity.coinsPerHour}/hr (max {opportunity.maxCoins} coins)
                </span>
              </div>
            </div>
          </div>

          {/* Commitment Checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="commitment"
              checked={hasCommitment}
              onCheckedChange={(checked) => setHasCommitment(checked as boolean)}
              data-testid="checkbox-commitment"
            />
            <label htmlFor="commitment" className="text-sm text-foreground leading-relaxed">
              I confirm my availability and commitment to complete this opportunity as described. 
              I understand that I will receive a confirmation email upon successful application.
            </label>
          </div>
        </div>

        <DialogFooter className="sm:justify-start">
          <div className="flex w-full space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
              data-testid="button-cancel-application"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!hasCommitment || isSubmitting}
              className="flex-1"
              data-testid="button-submit-application"
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Applying...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Apply Now
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
