import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { BtcScope, SolScope } from '@metamask/keyring-api';
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
import { getHdKeyringOfSelectedAccountOrPrimaryKeyring } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SrpList } from '../multi-srp/srp-list';

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
  const [showSrpSelection, setShowSrpSelection] = useState(false);

  // Here we are getting the keyring of the last selected account
  // if it is not an hd keyring, we will use the primary keyring
  const hdKeyring = useSelector(getHdKeyringOfSelectedAccountOrPrimaryKeyring);
  const [selectedKeyringId, setSelectedKeyringId] = useState<string>(
    hdKeyring.metadata.id,
  );

  const onSelectSrp = useCallback(() => {
    trackEvent({
      category: MetaMetricsEventCategory.Accounts,
      event: MetaMetricsEventName.SecretRecoveryPhrasePickerClicked,
      properties: {
        button_type: 'picker',
      },
    });
    setShowSrpSelection((previous) => !previous);
  }, []);

  const { clientType, chainId, networkName } = useMemo(() => {
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
      default:
        return { clientType: null, chainId: null, networkName: null };
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
          {showSrpSelection && (
            <SrpList
              onActionComplete={(keyringId: string) => {
                setSelectedKeyringId(keyringId);
                setShowSrpSelection(false);
              }}
            />
          )}
          {!showSrpSelection && (
            <>
              {clientType && chainId ? (
                <CreateSnapAccount
                  onActionComplete={onActionComplete}
                  selectedKeyringId={selectedKeyringId}
                  onSelectSrp={onSelectSrp}
                  clientType={clientType}
                  chainId={chainId}
                  setNewlyCreatedAccountAsSelected={true}
                />
              ) : (
                <CreateEthAccount
                  onActionComplete={onActionComplete}
                  selectedKeyringId={selectedKeyringId}
                  onSelectSrp={onSelectSrp}
                />
              )}
            </>
          )}
        </Box>
      </ModalBody>
    </ModalContent>
  );
};
