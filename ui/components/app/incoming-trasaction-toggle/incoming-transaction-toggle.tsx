import React, { useContext, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';

import ToggleButton from '../../ui/toggle-button';
import { Box, Text } from '../../component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

import { PolymorphicRef } from '../../component-library/box';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import NetworkToggle from './network-toggle';

interface IncomingTransactionToggleProps {
  wrapperRef?: PolymorphicRef<any>;
  incomingTransactionsPreferences: Record<string, boolean>;
  allNetworks: Record<string, any>[];
  setIncomingTransactionsPreferences: (
    chainId: string,
    isAllEnabledValue: boolean,
  ) => void;
}

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

  const [isAllEnabled, setIsAllEnabled] = useState(
    checkAllNetworks(incomingTransactionsPreferences),
  );

  useEffect(() => {
    setNetworkPreferences(
      generateIncomingNetworkPreferences(
        incomingTransactionsPreferences,
        allNetworks,
      ),
    );
  }, [incomingTransactionsPreferences, allNetworks]);

  useEffect(() => {
    setIsAllEnabled(checkAllNetworks(incomingTransactionsPreferences));
  }, [incomingTransactionsPreferences]);

  const toggleAllEnabled = (isAllEnabledValue: boolean): void => {
    Object.keys(incomingTransactionsPreferences).forEach((chainId) => {
      if (incomingTransactionsPreferences[chainId] !== isAllEnabledValue) {
        setIncomingTransactionsPreferences(chainId, isAllEnabledValue);
      }
    });
  };

  const toggleSingleNetwork = (chainId: string, value: boolean): void => {
    setIncomingTransactionsPreferences(chainId, value);
  };

  return (
    <Box ref={wrapperRef} className="mm-incoming-transaction-toggle">
      <Text variant={TextVariant.bodyMdMedium}>
        {t('showIncomingTransactions')}
      </Text>

      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
        {t('showIncomingTransactionsInformation')}
      </Text>
      <Box
        marginTop={3}
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
        data-testid="incoming-transaction-toggle-enable-all"
      >
        <Text variant={TextVariant.bodySmBold}>
          {t('enableForAllNetworks')}
        </Text>
        <ToggleButton
          value={isAllEnabled}
          onToggle={(value) => toggleAllEnabled(!value)}
          offLabel={t('off')}
          onLabel={t('on')}
        />
      </Box>
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

function checkAllNetworks(
  incomingTransactionsPreferences: Record<string, boolean>,
): boolean {
  return Object.values(incomingTransactionsPreferences).every(Boolean);
}
