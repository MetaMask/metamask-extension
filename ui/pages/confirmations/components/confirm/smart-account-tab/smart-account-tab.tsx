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
import { useNetworkSupporting7702 } from '../../../hooks/useNetworkSupporting7702';
import { AccountNetwork } from './account-network';

export const SmartAccountTab = ({ address }: { address: Hex }) => {
  const { network7702List, pending } = useNetworkSupporting7702(address);

  return (
    <>
      <BannerAlert
        title="Switch to smart account"
        severity={BannerAlertSeverity.Info}
        description="Same address. Smarter features. Learn more."
        marginTop={4}
      />
      {pending && (
        <Box
          paddingTop={12}
          paddingBottom={12}
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
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
