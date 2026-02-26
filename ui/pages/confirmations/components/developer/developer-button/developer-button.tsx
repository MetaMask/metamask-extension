import React from 'react';

import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
} from '../../../../../components/component-library';
import {
  IconColor,
  Display,
  FlexDirection,
  JustifyContent,
  AlignItems,
} from '../../../../../helpers/constants/design-system';

export type DeveloperButtonProps = {
  buttonLabel: string;
  description: string;
  disabled?: boolean;
  hasTriggered?: boolean;
  onPress: () => void;
  title: string;
};

export const DeveloperButton = ({
  buttonLabel,
  description,
  disabled,
  hasTriggered,
  onPress,
  title,
}: DeveloperButtonProps) => {
  return (
    <Box
      className="settings-page__content-row"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      gap={4}
    >
      <div className="settings-page__content-item">
        <span>{title}</span>
        <div className="settings-page__content-description">{description}</div>
      </div>

      <div className="settings-page__content-item-col">
        <Button
          variant={ButtonVariant.Primary}
          onClick={onPress}
          disabled={disabled}
        >
          {buttonLabel}
        </Button>
      </div>
      <div className="settings-page__content-item-col">
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          paddingLeft={2}
          paddingRight={2}
          style={{ height: '40px', width: '40px' }}
        >
          <Icon
            className="settings-page-developer-options__icon-check"
            name={IconName.Check}
            color={IconColor.successDefault}
            size={IconSize.Lg}
            hidden={!hasTriggered}
          />
        </Box>
      </div>
    </Box>
  );
};
