import React from 'react';
import { Hex } from '@metamask/utils';

import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
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
        description={t('smartAccountUpgradeBannerDescription')}
        marginTop={4}
      />
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
