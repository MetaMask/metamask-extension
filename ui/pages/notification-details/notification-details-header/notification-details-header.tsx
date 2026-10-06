import React from 'react';
import { IconName } from '../../../components/component-library/icon/icon.types';
import { ButtonIcon } from '../../../components/component-library/button-icon/button-icon';
import { ButtonIconSize } from '../../../components/component-library/button-icon/button-icon.types';
import { HeaderBase } from '../../../components/component-library/header-base/header-base';

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
          size={ButtonIconSize.Md}
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
