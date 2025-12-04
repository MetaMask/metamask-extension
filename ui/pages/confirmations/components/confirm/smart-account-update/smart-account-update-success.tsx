import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  ButtonLinkSize,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SmartAccountUpdateSuccess() {
  const t = useI18nContext();
  const navigate = useNavigate();

  const closeAccountUpdatePage = useCallback(() => {
    navigate(DEFAULT_ROUTE, { replace: true });
  }, [navigate]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BlockSize.TenTwelfths}
    >
      <ButtonIcon
        iconName={IconName.Close}
        onClick={closeAccountUpdatePage}
        size={ButtonIconSize.Sm}
        ariaLabel="close"
        className="smart-account-update__close-btn"
      />
      <Icon
        name={IconName.CheckBold}
        color={IconColor.successDefault}
        size={IconSize.Xl}
      />
      <Text
        color={TextColor.textDefault}
        variant={TextVariant.headingMd}
        marginBottom={2}
        marginTop={2}
      >
        {t('smartAccountUpdateSuccessTitle')}
      </Text>
      <Text
        color={TextColor.textDefault}
        textAlign={TextAlign.Center}
        variant={TextVariant.bodyMd}
      >
        {t('smartAccountUpdateSuccessMessage')}
      </Text>
      <ButtonLink
        size={ButtonLinkSize.Md}
        href={ZENDESK_URLS.ACCOUNT_UPGRADE}
        externalLink
      >
        {t('learnMoreUpperCase')}
      </ButtonLink>
    </Box>
  );
}
