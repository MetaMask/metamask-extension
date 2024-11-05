import React from 'react';
import { StatusTypes } from '../../../../app/scripts/controllers/bridge-status/types';
import { Icon, IconName } from '../../../components/component-library';
import { Color, IconColor } from '../../../helpers/constants/design-system';
import HollowCircle from './hollow-circle';

const ICON_COLOR = IconColor.primaryDefault;

const VerticalLine = () => (
  <div
    style={{
      height: '46px',
      width: '1px',
      backgroundColor: `var(--color-${Color.iconMuted})`,
    }}
  />
);

type StepsProgressItemProps = {
  stepStatus: StatusTypes | null;
  isLastItem: boolean;
};

export default function StepProgressItem({
  stepStatus,
  isLastItem,
}: StepsProgressItemProps) {
  return (
    <>
      {stepStatus === null && <HollowCircle color={ICON_COLOR} />}
      {stepStatus === StatusTypes.PENDING && (
        <Icon
          className="bridge-transaction-details__icon-loading" // Needed for animation
          name={IconName.Loading}
          color={ICON_COLOR}
        />
      )}
      {stepStatus === StatusTypes.COMPLETE && (
        <Icon name={IconName.FullCircle} color={ICON_COLOR} />
      )}
      {!isLastItem && <VerticalLine />}
    </>
  );
}
