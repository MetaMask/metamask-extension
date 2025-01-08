import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { EthKeyring, InternalAccount } from '@metamask/keyring-api';
import { Json } from '@metamask/utils';
import { KeyringTypes } from '@metamask/keyring-controller';
import { Box } from '../../../../components/component-library';
import { getInternalAccounts } from '../../../../selectors/accounts';
import SRPQuiz from '../../../../components/app/srp-quiz-modal/SRPQuiz';
import { SRPList } from '../../../../components/multichain/multi-srp/srp-list/srp-list';
import { getMetaMaskKeyrings } from '../../../../selectors/selectors';

export const RevealSRPList = () => {
  const [srpQuizModalVisible, setSrpQuizModalVisible] = useState(false);
  const [accountAddress, setAccountAddress] = useState('');
  const keyrings: (EthKeyring<Json> & {
    accounts: string[];
  })[] = useSelector(getMetaMaskKeyrings);
  const accounts: InternalAccount[] = useSelector(getInternalAccounts);
  const accountId = useMemo(
    () => accounts.find((account) => account.address === accountAddress)?.id,
    [accounts, accountAddress],
  );

  if (!accountId && srpQuizModalVisible) {
    throw new Error('Account not found');
  }

  return (
    <Box>
      <SRPList
        onActionComplete={(keyringIndex) => {
          const hdKeyrings = keyrings.filter(
            (keyring) => keyring.type === KeyringTypes.hd,
          );
          const keyring = hdKeyrings[keyringIndex];
          const keyringAccountAddress = keyring?.accounts[0];
          if (keyringAccountAddress) {
            setAccountAddress(keyringAccountAddress);
            setSrpQuizModalVisible(true);
          } else {
            throw new Error('Account not found');
          }
        }}
        hideShowAccounts={true}
      />
      {srpQuizModalVisible && accountId && (
        <SRPQuiz
          accountId={accountId}
          isOpen={srpQuizModalVisible}
          onClose={() => setSrpQuizModalVisible(false)}
        />
      )}
    </Box>
  );
};
