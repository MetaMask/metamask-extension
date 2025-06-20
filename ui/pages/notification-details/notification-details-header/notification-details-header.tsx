import React from 'react';
import {
  IconName,
  ButtonIcon,
  ButtonIconSize,
  HeaderBase,
} from '../../../components/component-library';

export const NotificationDetailsHeader = ({
  children,
  onClickBack,
}: {
  children: React.ReactNode;
  onClickBack: () => void;
}) => {
  return (
    <HeaderBase
      padding={4}
      startAccessory={
        <ButtonIcon
          ariaLabel="Back"
          iconName={IconName.ArrowLeft}
          size={ButtonIconSize.Sm}
          onClick={onClickBack}
          data-testid="notification-details-back-button"
        />
      }
      endAccessory={null}
    >
      {children}
    </HeaderBase>
  );
};
