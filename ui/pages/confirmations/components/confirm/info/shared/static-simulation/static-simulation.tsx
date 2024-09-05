import React from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';
import { Box } from '../../../../../../../components/component-library';

const StaticSimulation: React.FC<{
  title: string;
  titleTooltip: string;
  description: string;
  simulationHeading: string;
  simulationElements: React.ReactNode;
}> = ({
  title,
  titleTooltip,
  description,
  simulationHeading,
  simulationElements,
}) => {
  return (
    <ConfirmInfoSection data-testid="confirmation__simulation_section">
      <ConfirmInfoRow label={title} tooltip={titleTooltip}>
        <ConfirmInfoRowText text={description} />
      </ConfirmInfoRow>
      <ConfirmInfoRow label={simulationHeading}>
        <Box style={{ marginLeft: 'auto', maxWidth: '100%' }}>
          {simulationElements}
        </Box>
      </ConfirmInfoRow>
    </ConfirmInfoSection>
  );
};

export default StaticSimulation;
