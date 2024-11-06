import React from 'react';
import { StatusTypes } from '../../../../app/scripts/controllers/bridge-status/types';
import {
  Box,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { IconColor } from '../../../helpers/constants/design-system';
import HollowCircle from './hollow-circle';
import PulsingCircle from './pulsing-circle';

const ICON_SIZE = IconSize.Xs;

const VerticalLine = ({ color }: { color: IconColor }) => (
  <div
    style={{
      height: '60px',
      marginTop: '-1rem',
      marginBottom: '-1rem',
      width: '1px',
      backgroundColor: `var(--color-${color})`,
    }}
  />
);

type StepsProgressBarItemProps = {
  stepStatus: StatusTypes | null;
  isLastItem: boolean;
  isEdgeComplete: boolean;
  children: React.ReactNode;
};

/**
 * Renders the steps in the Bridge Transaction Details page
 */
export default function StepProgressBarItem({
  stepStatus,
  isLastItem,
  isEdgeComplete,
  children,
}: StepsProgressBarItemProps) {
  return (
    <>
      {/* Indicator dots */}
      {stepStatus === null && (
        <HollowCircle size={ICON_SIZE} color={IconColor.iconMuted} />
      )}
      {stepStatus === StatusTypes.PENDING && (
        <PulsingCircle iconSize={ICON_SIZE} color={IconColor.primaryDefault} />
      )}
      {stepStatus === StatusTypes.COMPLETE && (
        <Icon
          name={IconName.FullCircle}
          color={IconColor.primaryDefault}
          size={ICON_SIZE}
        />
      )}

      {/* Description */}
      {children}

      {/* Line */}
      {!isLastItem && (
        <VerticalLine
          color={
            isEdgeComplete ? IconColor.primaryDefault : IconColor.iconMuted
          }
        />
      )}

      {/* Blank div to take up space to make sure everythign */}
      {!isLastItem && <div />}
    </>
  );
}
