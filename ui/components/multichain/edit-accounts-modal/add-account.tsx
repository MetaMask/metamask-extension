import React, { useCallback, useContext, useMemo } from 'react';
import {
  Box,
  IconName,
  ButtonIcon,
  ModalBody,
  ModalContent,
  ModalHeader,
} from '../../component-library';
import { WalletClientType } from '../../../hooks/accounts/useMultichainWalletSnapClient';
import { CreateSnapAccount } from '../create-snap-account/create-snap-account';
import { CreateEthAccount } from '../create-eth-account';
import { useSelector } from 'react-redux';
import { getHdKeyringOfSelectedAccountOrPrimaryKeyring } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { BtcScope, SolScope } from '@metamask/keyring-api';

type EditAccountAddAccountFormProps = {
  accountType: WalletClientType | 'EVM'; // undefined is default evm.
  onActionComplete: (completed: boolean) => Promise<void>;
  onBack: () => void;
  onClose: () => void;
};

export const EditAccountAddAccountForm: React.FC<
  EditAccountAddAccountFormProps
> = ({ accountType, onActionComplete, onBack, onClose }) => {
  const trackEvent = useContext(MetaMetricsContext);
  const t = useI18nContext();

  // Here we are getting the keyring of the last selected account
  // if it is not an hd keyring, we will use the primary keyring
  const hdKeyring = useSelector(getHdKeyringOfSelectedAccountOrPrimaryKeyring);

  const onSelectSrp = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Accounts,
      event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
    });
  }, []);

  const { clientType, chainId, networkName } = useMemo(() => {
    if (accountType === 'EVM') {
      return { clientType: null, chainId: null, networkName: null };
    }
    switch (accountType) {
      case WalletClientType.Bitcoin:
        return {
          clientType: WalletClientType.Bitcoin,
          chainId: BtcScope.Mainnet,
          networkName: t('networkNameBitcoin'),
        };
      case WalletClientType.Solana:
        return {
          clientType: WalletClientType.Solana,
          chainId: SolScope.Mainnet,
          networkName: t('networkNameSolana'),
        };
    }
  }, [accountType]);

  return (
    <ModalContent>
      <ModalHeader
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            onClick={onBack}
            ariaLabel={t('back')}
          />
        }
        endAccessory={
          <ButtonIcon
            iconName={IconName.Close}
            onClick={onClose}
            ariaLabel={t('close')}
          />
        }
      >
        {networkName
          ? t('addAccountFromNetwork', [networkName])
          : t('addAccount')}
      </ModalHeader>
      <ModalBody>
        <Box paddingLeft={4} paddingRight={4} paddingBottom={4}>
          {accountType && clientType && chainId ? (
            <CreateSnapAccount
              onActionComplete={onActionComplete}
              selectedKeyringId={hdKeyring.metadata.id}
              onSelectSrp={onSelectSrp}
              clientType={clientType}
              chainId={chainId}
            />
          ) : (
            <CreateEthAccount
              onActionComplete={onActionComplete}
              selectedKeyringId={hdKeyring.metadata.id}
              onSelectSrp={onSelectSrp}
            />
          )}
        </Box>
      </ModalBody>
    </ModalContent>
  );
};
