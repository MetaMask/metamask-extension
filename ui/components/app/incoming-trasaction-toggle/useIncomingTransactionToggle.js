import { useState, useEffect } from 'react';
import { TEST_CHAINS } from '../../../../shared/constants/network';

export const useIncomingTransactionToggle = ({
  allNetworks,
  incomingTransactionsPreferences,
  setIncomingTransactionsPreferences,
}) => {
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

  const toggleAllEnabled = (isAllEnabledValue) => {
    Object.keys(incomingTransactionsPreferences).forEach((chainId) => {
      if (incomingTransactionsPreferences[chainId] !== isAllEnabledValue) {
        setIncomingTransactionsPreferences(chainId, isAllEnabledValue);
      }
    });
  };

  const toggleSingleNetwork = (chainId, value) => {
    setIncomingTransactionsPreferences(chainId, value);
  };

  return {
    networkPreferences,
    isAllEnabled,
    toggleAllEnabled,
    toggleSingleNetwork,
  };
};

function generateIncomingNetworkPreferences(
  incomingTransactionsPreferences,
  allNetworks,
) {
  const incomingTxnPreferences = {};

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

function checkAllNetworks(incomingTransactionsPreferences) {
  return Object.values(incomingTransactionsPreferences).every(Boolean);
}
