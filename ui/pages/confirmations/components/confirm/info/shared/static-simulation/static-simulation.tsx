import React from 'react';

import { Box } from '../../../../../../../components/component-library';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import {
  Display,
  JustifyContent,
} from '../../../../../../../helpers/constants/design-system';
import Preloader from '../../../../../../../components/ui/icon/preloader';

const StaticSimulation: React.FC<{
  title: string;
  titleTooltip: string;
  description: string;
  simulationElements: React.ReactNode;
  isLoading?: boolean;
}> = ({ title, titleTooltip, description, simulationElements, isLoading }) => {
  return (
    <ConfirmInfoSection data-testid="confirmation__simulation_section">
      <ConfirmInfoRow label={title} tooltip={titleTooltip}>
        <ConfirmInfoRowText text={description} />
      </ConfirmInfoRow>
      {isLoading ? (
        <Box display={Display.Flex} justifyContent={JustifyContent.center}>
          <Preloader size={20} />
        </Box>
      ) : (
        simulationElements
      )}
    </ConfirmInfoSection>
  );
};

export default StaticSimulation;
