import React, { useCallback } from 'react';
import { CaipChainId } from '@metamask/utils';
import { useDispatch, useSelector } from 'react-redux';

import { toggleNetworkMenu } from '../../../../store/actions';
import {
  MULTICHAIN_NETWORK_TO_NICKNAME,
  MultichainNetworks,
  MULTICHAIN_NETWORK_TO_ACCOUNT_TYPE_NAME,
} from '../../../../../shared/constants/multichain/networks';
import {
  Box,
  Text,
  ButtonPrimary,
  ButtonPrimarySize,
} from '../../../component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
  TextVariant,
  TextAlign,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { getMetaMaskHdKeyrings } from '../../../../selectors';
import { CreateSnapAccount } from '../../create-snap-account';
import { SrpList } from '../../multi-srp/srp-list';
import { WalletClientType } from '../../../../hooks/accounts/useMultichainWalletSnapClient';

const SNAP_CLIENT_CONFIG_MAP: Record<
  string,
  { clientType: WalletClientType | null; chainId: CaipChainId | null }
> = {
  [MultichainNetworks.BITCOIN]: {
    clientType: WalletClientType.Bitcoin,
    chainId: MultichainNetworks.BITCOIN,
  },
  [MultichainNetworks.BITCOIN_TESTNET]: {
    clientType: WalletClientType.Bitcoin,
    chainId: MultichainNetworks.BITCOIN_TESTNET,
  },
  [MultichainNetworks.BITCOIN_SIGNET]: {
    clientType: WalletClientType.Bitcoin,
    chainId: MultichainNetworks.BITCOIN_SIGNET,
  },
  [MultichainNetworks.SOLANA]: {
    clientType: WalletClientType.Solana,
    chainId: MultichainNetworks.SOLANA,
  },
  [MultichainNetworks.SOLANA_TESTNET]: {
    clientType: WalletClientType.Solana,
    chainId: MultichainNetworks.SOLANA_TESTNET,
  },
  [MultichainNetworks.SOLANA_DEVNET]: {
    clientType: WalletClientType.Solana,
    chainId: MultichainNetworks.SOLANA_DEVNET,
  },
};

const AddNonEvmAccountModal = ({ chainId }: { chainId: CaipChainId }) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const [primaryKeyring] = useSelector(getMetaMaskHdKeyrings);
  const [showSrpSelection, setShowSrpSelection] = React.useState(false);
  const [showCreateAccount, setShowCreateAccount] = React.useState(false);
  const [selectedKeyringId, setSelectedKeyringId] = React.useState(
    primaryKeyring.metadata.id,
  );

  const handleActionComplete = useCallback(
    async (confirmed: boolean) => {
      if (confirmed) {
        dispatch(toggleNetworkMenu());
      } else {
        setShowCreateAccount(false);
      }
    },
    [dispatch],
  );

  const handleSelectSrp = useCallback(() => {
    setShowSrpSelection(true);
    setShowCreateAccount(false);
  }, []);

  const handleSrpActionComplete = useCallback((keyringId: string) => {
    setSelectedKeyringId(keyringId);
    setShowCreateAccount(true);
  }, []);

  const handleAddAccount = useCallback(() => {
    setShowCreateAccount(true);
  }, []);

  const { clientType, chainId: mappedChainId } = SNAP_CLIENT_CONFIG_MAP[
    chainId
  ] || {
    clientType: null,
    chainId: null,
  };

  if (showCreateAccount && clientType && mappedChainId) {
    return (
      <Box
        className="add-non-evm-account-modal"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.spaceBetween}
        minWidth={BlockSize.Half}
      >
        <Box padding={4}>
          <CreateSnapAccount
            onActionComplete={handleActionComplete}
            selectedKeyringId={selectedKeyringId}
            onSelectSrp={handleSelectSrp}
            clientType={clientType}
            chainId={mappedChainId}
          />
        </Box>
      </Box>
    );
  }

  if (showSrpSelection) {
    return (
      <Box
        className="add-non-evm-account-modal"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.spaceBetween}
      >
        <SrpList onActionComplete={handleSrpActionComplete} />
      </Box>
    );
  }

  return (
    <Box
      className="add-non-evm-account-modal"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.flexStart}
      paddingTop={4}
    >
      <Box paddingLeft={4} paddingRight={4}>
        <Text textAlign={TextAlign.Left} variant={TextVariant.bodyMd}>
          {t('addNonEvmAccountFromNetworkPicker', [
            MULTICHAIN_NETWORK_TO_NICKNAME[chainId],
            MULTICHAIN_NETWORK_TO_ACCOUNT_TYPE_NAME[chainId],
          ])}
        </Text>
      </Box>
      <Box
        className="add-non-evm-account-modal__footer"
        padding={4}
        width={BlockSize.Full}
      >
        <ButtonPrimary
          width={BlockSize.Full}
          size={ButtonPrimarySize.Lg}
          onClick={handleAddAccount}
        >
          {t('addAccount')}
        </ButtonPrimary>
      </Box>
    </Box>
  );
};

export default AddNonEvmAccountModal;
