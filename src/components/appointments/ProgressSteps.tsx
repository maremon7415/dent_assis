import { ChevronRightIcon } from "lucide-react";

const PROGRESS_STEPS = ["Select Dentist", "Choose Time", "Confirm"];

function ProgressSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8 overflow-x-auto pb-2">
      {PROGRESS_STEPS.map((stepName, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep >= stepNumber;

        return (
          <div
            key={stepNumber}
            className="flex items-center gap-1 sm:gap-2 shrink-0"
          >
            {/* step circle */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {stepNumber}
            </div>

            {/* step name - hidden on small screens */}
            <span
              className={`text-xs sm:text-sm hidden sm:block ${
                isActive ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {stepName}
            </span>

            {/* arrow (not shown for last step) */}
            {stepNumber < PROGRESS_STEPS.length && (
              <ChevronRightIcon className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
export default ProgressSteps;
