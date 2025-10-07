import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { CaipChainId } from '@metamask/utils';
import { InternalAccount } from '@metamask/keyring-internal-api';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import {
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
} from '../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
import { setSelectedAccount } from '../../store/actions';
import { useMultichainBalances } from '../../hooks/useMultichainBalances';
import { NonEvmQueryParams } from '../../../shared/lib/deep-links/routes/nonevm';
import { RampsMetaMaskEntry } from '../../hooks/ramps/useRamps/useRamps';
import { getLastSelectedNonEvmAccount } from '../../selectors/multichain';
import {
  getDataCollectionForMarketing,
  getMetaMaskAccountsOrdered,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../selectors';
import { BaseUrl } from '../../../shared/constants/urls';
import { MetaMetricsSwapsEventSource } from '../../../shared/constants/metametrics';
import AddNonEvmAccountModal from '../../components/multichain/network-list-menu/add-non-evm-account/add-non-evm-account';
import useBridging from '../../hooks/bridge/useBridging';

const getBuyUrl = (
  chainId: CaipChainId,
  metaMetricsId: string | null,
  isMetaMetricsEnabled: boolean,
  isMarketingEnabled: boolean,
): string => {
  const buyParams = new URLSearchParams();
  buyParams.set('metamaskEntry', RampsMetaMaskEntry.BuySellButton);
  buyParams.set('chainId', chainId);

  if (metaMetricsId) {
    buyParams.set('metametricsId', metaMetricsId);
  }

  buyParams.set('metricsEnabled', String(isMetaMetricsEnabled));

  if (isMarketingEnabled) {
    buyParams.set('marketingEnabled', String(isMarketingEnabled));
  }

  const buyUrl = new URL('/buy', BaseUrl.Portfolio);
  buyUrl.search = buyParams.toString();
  return buyUrl.toString();
};

export const NonEvmBalanceCheck = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);
  const accounts = useSelector(getMetaMaskAccountsOrdered);
  const lastSelectedNonEvmAccount = useSelector(getLastSelectedNonEvmAccount);

  const params = new URLSearchParams(location.search);
  const chainId = params.get(NonEvmQueryParams.ChainId) as CaipChainId;

  const { assetsWithBalance } = useMultichainBalances();

  const hasAccountForChain = accounts.some((account: InternalAccount) =>
    account.scopes.includes(chainId),
  );

  const { openBridgeExperience } = useBridging();

  useEffect(() => {
    if (!chainId) {
      return;
    }

    if (hasAccountForChain) {
      // If we have a "last selected" non-EVM account that matches the chain -> switch to it
      if (lastSelectedNonEvmAccount?.scopes?.includes(chainId)) {
        dispatch(setSelectedAccount(lastSelectedNonEvmAccount.address));
      }

      const hasPositiveBalance = assetsWithBalance.some(
        (asset) =>
          asset.chainId === chainId && asset.balance && asset.balance !== '0',
      );

      if (hasPositiveBalance) {
        openBridgeExperience(
          MetaMetricsSwapsEventSource.MainView,
          getNativeAssetForChainId(chainId),
        );
      } else {
        window.location.href = getBuyUrl(
          chainId,
          metaMetricsId,
          isMetaMetricsEnabled,
          isMarketingEnabled,
        );
      }
    }
  }, [
    chainId,
    openBridgeExperience,
    assetsWithBalance,
    metaMetricsId,
    isMetaMetricsEnabled,
    isMarketingEnabled,
    hasAccountForChain,
    accounts,
  ]);

  if (!hasAccountForChain) {
    return (
      <Modal
        isOpen
        onClose={() => {
          // do nothing
        }}
      >
        <ModalOverlay />
        <ModalContent
          modalDialogProps={{
            padding: 0,
            display: Display.Flex,
            flexDirection: FlexDirection.Column,
          }}
        >
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            justifyContent={JustifyContent.spaceBetween}
            width={BlockSize.Full}
            padding={2}
          >
            <AddNonEvmAccountModal chainId={chainId} />
          </Box>
        </ModalContent>
      </Modal>
    );
  }

  return null;
};
