import React from 'react';
import { StatusTypes } from '../../../../app/scripts/controllers/bridge-status/types';
import {
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { Color, IconColor } from '../../../helpers/constants/design-system';
import HollowCircle from './hollow-circle';

const ICON_SIZE = IconSize.Xs;
const ICON_STYLE = { marginTop: '0.25rem', marginBottom: '0.25rem' };

const VerticalLine = ({ color }: { color: IconColor }) => (
  <div
    style={{
      height: '46px',
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
        <HollowCircle
          color={IconColor.iconMuted}
          size={ICON_SIZE}
          style={ICON_STYLE}
        />
      )}
      {stepStatus === StatusTypes.PENDING && (
        <Icon
          className="bridge-transaction-details__icon-loading" // Needed for animation
          name={IconName.Loading}
          color={IconColor.primaryDefault}
          size={ICON_SIZE}
          style={ICON_STYLE}
        />
      )}
      {stepStatus === StatusTypes.COMPLETE && (
        <Icon
          name={IconName.FullCircle}
          color={IconColor.primaryDefault}
          size={ICON_SIZE}
          style={ICON_STYLE}
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
      {!isLastItem && <div style={{ opacity: 0 }} />}
    </>
  );
}
