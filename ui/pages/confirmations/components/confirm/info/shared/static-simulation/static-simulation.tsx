import React from 'react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../../../components/app/confirm/info/row';
import { ConfirmInfoSection } from '../../../../../../../components/app/confirm/info/row/section';

const StaticSimulation: React.FC<{
  title: string;
  titleTooltip: string;
  description: string;
  simulationElements: React.ReactNode;
}> = ({ title, titleTooltip, description, simulationElements }) => {
  return (
    <ConfirmInfoSection data-testid="confirmation__simulation_section">
      <ConfirmInfoRow label={title} tooltip={titleTooltip}>
        <ConfirmInfoRowText text={description} />
      </ConfirmInfoRow>
      {simulationElements}
    </ConfirmInfoSection>
  );
};

export default StaticSimulation;
