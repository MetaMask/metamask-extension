import React from 'react';
import {
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  Box,
  TextVariant,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import type { AccountStatusLayoutProps } from './account-status-layout.types';

export function AccountStatusLayout({
  dataTestId,
  rootClassName = '',
  titleKey,
  descriptionKey,
  descriptionInterpolation = [],
  primaryButtonTextKey,
  onPrimaryButtonClick,
  secondaryButtonTextKey,
  onSecondaryButtonClick,
}: Readonly<AccountStatusLayoutProps>) {
  const t = useI18nContext();
  const title = t(titleKey);
  const description = t(descriptionKey, descriptionInterpolation);

  return (
    <Box
      data-testid={dataTestId}
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      className={rootClassName}
      gap={6}
    >
      <Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Start}
        >
          <Text variant={TextVariant.HeadingLg} className="self-start mb-4">
            {title}
          </Text>
          <Box
            flexDirection={BoxFlexDirection.Row}
            justifyContent={BoxJustifyContent.Center}
            alignItems={BoxAlignItems.Center}
            className="mb-6 w-full"
          >
            <img
              src="images/account-status.png"
              width={276}
              height={276}
              alt={title}
              className="self-center mx-auto"
            />
          </Box>
          <Text variant={TextVariant.BodyMd} className="mb-6">
            {description}
          </Text>
        </Box>
      </Box>

      <Box
        flexDirection={BoxFlexDirection.Column}
        justifyContent={BoxJustifyContent.Center}
        alignItems={BoxAlignItems.Center}
        className="w-full"
        gap={4}
      >
        <Button
          data-testid="onboarding-complete-done"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          className="w-full"
          onClick={onPrimaryButtonClick}
        >
          {t(primaryButtonTextKey)}
        </Button>
        <Button
          data-testid="account-exist-login-with-different-method"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          className="w-full"
          onClick={onSecondaryButtonClick}
        >
          {t(secondaryButtonTextKey)}
        </Button>
      </Box>
    </Box>
  );
}
