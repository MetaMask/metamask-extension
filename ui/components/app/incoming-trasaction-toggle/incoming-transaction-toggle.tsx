import React, { useContext, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';

import { Box, Text } from '../../component-library';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

import { PolymorphicRef } from '../../component-library/box';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import NetworkToggle from './network-toggle';

type IncomingTransactionToggleProps = {
  wrapperRef?: PolymorphicRef<any>;
  incomingTransactionsPreferences: Record<string, boolean>;
  allNetworks: Record<string, any>[];
  setIncomingTransactionsPreferences: (
    chainId: string,
    isAllEnabledValue: boolean,
  ) => void;
};

const IncomingTransactionToggle = ({
  wrapperRef,
  incomingTransactionsPreferences,
  allNetworks,
  setIncomingTransactionsPreferences,
}: IncomingTransactionToggleProps) => {
  const t = useContext(I18nContext);

  const [networkPreferences, setNetworkPreferences] = useState(
    generateIncomingNetworkPreferences(
      incomingTransactionsPreferences,
      allNetworks,
    ),
  );

  useEffect(() => {
    setNetworkPreferences(
      generateIncomingNetworkPreferences(
        incomingTransactionsPreferences,
        allNetworks,
      ),
    );
  }, [incomingTransactionsPreferences, allNetworks]);

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
  allNetworks: PropTypes.array.isRequired,
  setIncomingTransactionsPreferences: PropTypes.func.isRequired,
};

function generateIncomingNetworkPreferences(
  incomingTransactionsPreferences: Record<string, boolean>,
  allNetworks: Record<string, any>,
): Record<string, any> {
  const incomingTxnPreferences: Record<string, any> = {};

  Object.keys(allNetworks).forEach((id) => {
    const { chainId } = allNetworks[id];
    incomingTxnPreferences[chainId] = {
      isShowIncomingTransactions: incomingTransactionsPreferences[chainId],
      isATestNetwork: TEST_CHAINS.includes(chainId),
      label: allNetworks[id].nickname,
      imageUrl: allNetworks[id].rpcPrefs?.imageUrl,
    };
  });

  return incomingTxnPreferences;
}
