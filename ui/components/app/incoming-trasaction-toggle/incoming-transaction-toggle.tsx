import React, { useContext, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { NetworkConfiguration } from '@metamask/network-controller';
import { Hex } from '@metamask/utils';
import { I18nContext } from '../../../contexts/i18n';

import { Box, Text } from '../../component-library';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

import { PolymorphicRef } from '../../component-library/box';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  TEST_CHAINS,
} from '../../../../shared/constants/network';
import NetworkToggle from './network-toggle';

type IncomingTransactionToggleProps = {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wrapperRef?: PolymorphicRef<any>;
  incomingTransactionsPreferences: Record<string, boolean>;
  networkConfigurations: Record<Hex, NetworkConfiguration>;
  setIncomingTransactionsPreferences: (
    chainId: string,
    isAllEnabledValue: boolean,
  ) => void;
};

const IncomingTransactionToggle = ({
  wrapperRef,
  incomingTransactionsPreferences,
  networkConfigurations,
  setIncomingTransactionsPreferences,
}: IncomingTransactionToggleProps) => {
  const t = useContext(I18nContext);

  const [networkPreferences, setNetworkPreferences] = useState(
    generateIncomingNetworkPreferences(
      incomingTransactionsPreferences,
      networkConfigurations,
    ),
  );

  useEffect(() => {
    setNetworkPreferences(
      generateIncomingNetworkPreferences(
        incomingTransactionsPreferences,
        networkConfigurations,
      ),
    );
  }, [incomingTransactionsPreferences, networkConfigurations]);

  const toggleSingleNetwork = (chainId: string, value: boolean): void => {
    setIncomingTransactionsPreferences(chainId, value);
  };

  return (
    <Box ref={wrapperRef} className="mm-incoming-transaction-toggle">
      <Text variant={TextVariant.bodyMd}>{t('showIncomingTransactions')}</Text>
      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
        {t('showIncomingTransactionsExplainer')}
      </Text>
      {Object.keys(networkPreferences).map((chainId, index) => {
        return (
          <NetworkToggle
            key={index}
            chainId={chainId}
            networkPreferences={networkPreferences[chainId]}
            toggleSingleNetwork={toggleSingleNetwork}
          />
        );
      })}
    </Box>
  );
};

export default IncomingTransactionToggle;

IncomingTransactionToggle.propTypes = {
  wrapperRef: PropTypes.object,
  incomingTransactionsPreferences: PropTypes.object.isRequired,
  networkConfigurations: PropTypes.object.isRequired,
  setIncomingTransactionsPreferences: PropTypes.func.isRequired,
};

function generateIncomingNetworkPreferences(
  incomingTransactionsPreferences: Record<string, boolean>,
  networkConfigurations: Record<Hex, NetworkConfiguration>,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const incomingTxnPreferences: Record<string, any> = {};

  Object.values(networkConfigurations).forEach((network) => {
    incomingTxnPreferences[network.chainId] = {
      isShowIncomingTransactions:
        incomingTransactionsPreferences[network.chainId],
      isATestNetwork: TEST_CHAINS.includes(
        network.chainId as (typeof TEST_CHAINS)[number],
      ),
      label: network.name,
      imageUrl:
        CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
          network.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
        ],
    };
  });

  return incomingTxnPreferences;
}
