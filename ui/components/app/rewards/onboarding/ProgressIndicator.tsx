import React from 'react';
import {
  Box,
  BoxFlexDirection,
  BoxJustifyContent,
  BoxAlignItems,
} from '@metamask/design-system-react';

import { useTheme } from '../../../../hooks/useTheme';

type ProgressIndicatorProps = {
  totalSteps: number;
  currentStep: number;
};

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  totalSteps,
  currentStep,
}) => {
  const theme = useTheme();
  const activeColor = theme === 'light' ? 'bg-black' : 'bg-white';

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      className="gap-1"
      data-testid="progress-indicator-container"
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <Box
          key={index}
          className={`h-3 rounded-xl
            ${index === currentStep - 1 ? `w-6 ${activeColor}` : 'w-3 h-3 bg-muted'}`}
        />
      ))}
    </Box>
  );
};

export default ProgressIndicator;
