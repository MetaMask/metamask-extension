import React from 'react';
import { StatusTypes } from '@metamask/bridge-controller';
import {
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
      zIndex: 0.1,
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
 *
 * @param options
 * @param options.stepStatus - The status of the step
 * @param options.isLastItem - Whether the step is the last item
 * @param options.isEdgeComplete - Whether the edge is complete
 * @param options.children - The description of the step to be rendered
 */
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function StepProgressBarItem({
  stepStatus,
  isLastItem,
  isEdgeComplete,
  children,
}: StepsProgressBarItemProps) {
  return (
    <>
      {/* Indicator dots */}
      {(stepStatus === null || stepStatus === StatusTypes.UNKNOWN) && (
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

      {/* Blank div to take up space to make sure everything is aligned */}
      {!isLastItem && <div />}
    </>
  );
}
