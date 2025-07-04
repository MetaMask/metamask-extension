import React, { useCallback } from 'react';
import { useHistory } from 'react-router-dom';

import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import IconButton from '../../../../../components/ui/icon-button/icon-button-round';
import {
  Box,
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
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export function SmartAccountUpdateSuccess() {
  const t = useI18nContext();
  const history = useHistory();

  const closeAccountUpdatePage = useCallback(() => {
    history.replace('/');
  }, [history]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
      height={BlockSize.TenTwelfths}
    >
      <IconButton
        Icon={<Icon name={IconName.Close} />}
        onClick={closeAccountUpdatePage}
        className="smart-account-update__close"
        label=""
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
      <Text color={TextColor.textDefault} variant={TextVariant.bodyMd}>
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
