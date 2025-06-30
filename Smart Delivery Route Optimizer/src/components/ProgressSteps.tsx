import React from 'react';
import { Upload, Settings, Truck, Route, Check } from 'lucide-react';

interface ProgressStepsProps {
  currentStep: number;
}

const steps = [
  { id: 1, name: 'Upload Deliveries', icon: Upload },
  { id: 2, name: 'Map Data', icon: Settings },
  { id: 3, name: 'Vehicle Setup', icon: Truck },
  { id: 4, name: 'Optimize Route', icon: Route },
];

export const ProgressSteps: React.FC<ProgressStepsProps> = ({ currentStep }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                    ${isCompleted 
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' 
                      : isCurrent 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white ring-4 ring-blue-100' 
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <Check className="w-7 h-7" />
                  ) : (
                    <StepIcon className="w-7 h-7" />
                  )}
                </div>
                <span
                  className={`
                    mt-3 text-sm font-medium transition-colors duration-300
                    ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'}
                  `}
                >
                  {step.name}
                </span>
              </div>
              
              {index < steps.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-4 rounded-full transition-colors duration-300
                    ${isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gray-200'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};