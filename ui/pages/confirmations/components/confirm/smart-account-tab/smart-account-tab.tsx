import React from 'react';
import { Hex } from '@metamask/utils';

import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  ButtonLink,
  ButtonLinkSize,
  Text,
} from '../../../../../components/component-library';
import Preloader from '../../../../../components/ui/icon/preloader';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useEIP7702Networks } from '../../../hooks/useEIP7702Networks';
import { AccountNetwork } from './account-network/account-network';

export const SmartAccountTab = ({ address }: { address: Hex }) => {
  const t = useI18nContext();
  const { network7702List, pending } = useEIP7702Networks(address);

  return (
    <>
      <BannerAlert
        title={t('smartAccountUpgradeBannerTitle')}
        severity={BannerAlertSeverity.Info}
        marginTop={4}
      >
        <>
          <Text>{t('smartAccountUpgradeBannerDescription')}</Text>
          <ButtonLink
            onClick={() => {
              global.platform.openTab({
                url: ZENDESK_URLS.ACCOUNT_UPGRADE,
              });
            }}
            size={ButtonLinkSize.Inherit}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('learnMoreUpperCase')}
          </ButtonLink>
        </>
      </BannerAlert>
      {pending && (
        <Box
          paddingTop={12}
          paddingBottom={12}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
          data-testid="network-loader"
        >
          <Preloader size={18} />
        </Box>
      )}
      {network7702List?.map((networkConfiguration) => (
        <AccountNetwork
          key={networkConfiguration.chainId}
          networkConfiguration={networkConfiguration}
          address={address}
        />
      ))}
    </>
  );
};
