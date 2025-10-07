import React, { useCallback, useContext, useMemo, useState } from 'react';
import {
  Box,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';
import {
  CaipChainId,
  isCaipAssetType,
  parseCaipAssetType,
} from '@metamask/utils';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { TokenPaymentInfo } from '@metamask/subscription-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { getBuyableChains } from '../../../../ducks/ramps';
import useRamps from '../../../../hooks/ramps/useRamps/useRamps';
import { getCurrentChainId } from '../../../../../shared/modules/selectors/networks';
import { getIsMultichainAccountsState2Enabled } from '../../../../selectors/multichain-accounts';
import { getSelectedAccountGroup } from '../../../../selectors/multichain-accounts/account-tree';
import {
  MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE,
  PREPARE_SWAP_ROUTE,
} from '../../../../helpers/constants/routes';
import {
  AddressListQueryParams,
  AddressListSource,
} from '../../../../pages/multichain-accounts/multichain-account-address-list-page';
import { ReceiveModal } from '../../../multichain/receive-modal';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import { getIsUnifiedUIEnabled } from '../../../../ducks/bridge/selectors';
import useBridging from '../../../../hooks/bridge/useBridging';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../../shared/constants/metametrics';
import { ALL_ALLOWED_BRIDGE_CHAIN_IDS } from '../../../../../shared/constants/bridge';
import {
  getCurrentKeyring,
  getIsSwapsChain,
  getNetworkConfigurationIdByChainId,
} from '../../../../selectors';
import { setSwapToToken } from '../../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { AggregatorNetwork } from '../../../../ducks/ramps/types';
import { trace, TraceName } from '../../../../../shared/lib/trace';
import { setActiveNetworkWithError } from '../../../../store/actions';

const AddFundsModal = ({
  onClose,
  token,
}: {
  onClose: () => void;
  token: TokenPaymentInfo & {
    chainId: `0x${string}` | CaipChainId | undefined;
  };
}) => {
  const t = useI18nContext();
  const { openBuyCryptoInPdapp } = useRamps();
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const currentChainId = useSelector(getCurrentChainId);
  const networks = useSelector(getNetworkConfigurationIdByChainId) as Record<
    string,
    string
  >;
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);

  // FIXME: This causes re-renders, so use isEqual to avoid this
  const account = useSelector(getSelectedInternalAccount, isEqual);
  const { address: selectedAddress } = account;

  const buyableChains = useSelector(getBuyableChains);

  // Multichain accounts feature flag and selected account group
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);

  const { openBridgeExperience } = useBridging();
  const isUnifiedUIEnabled = useSelector(getIsUnifiedUIEnabled);
  const isSwapsChain = useSelector(getIsSwapsChain);

  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const isBuyableChain = useMemo(() => {
    if (!token.chainId) {
      return false;
    }
    return buyableChains.some(
      (network: AggregatorNetwork) =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        String(network.chainId) === hexToDecimal(token.chainId!),
    );
  }, [buyableChains, token.chainId]);

  const handleBuyAndSellOnClick = useCallback(() => {
    openBuyCryptoInPdapp();
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'Transaction Shield',
        text: 'Buy',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: token.chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: token.symbol,
      },
    });
  }, [token.chainId, openBuyCryptoInPdapp, token.symbol, trackEvent]);

  const handleReceiveOnClick = useCallback(() => {
    trace({ name: TraceName.ReceiveModal });
    trackEvent({
      event: MetaMetricsEventName.NavReceiveButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        text: 'Receive',
        location: 'Transaction Shield',
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        chain_id: token.chainId,
      },
    });

    if (isMultichainAccountsState2Enabled && selectedAccountGroup) {
      // Navigate to the multichain address list page with receive source
      history.push(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(selectedAccountGroup)}?${AddressListQueryParams.Source}=${AddressListSource.Receive}`,
      );
    } else {
      // Show the traditional receive modal
      setShowReceiveModal(true);
    }
  }, [
    isMultichainAccountsState2Enabled,
    selectedAccountGroup,
    history,
    token.chainId,
    trackEvent,
  ]);

  const handleBridgeOnClick = useCallback(
    async (isSwap: boolean) => {
      // Determine the chainId to use in the Swap experience using the url
      const urlSuffix = location.pathname.split('/').filter(Boolean).at(-1);
      const hexChainOrAssetId = urlSuffix
        ? decodeURIComponent(urlSuffix)
        : undefined;
      const chainIdToUse = isCaipAssetType(hexChainOrAssetId)
        ? parseCaipAssetType(hexChainOrAssetId).chainId
        : hexChainOrAssetId;

      // Handle clicking from the wallet or native asset overview page
      openBridgeExperience(
        MetaMetricsSwapsEventSource.MainView,
        chainIdToUse && ALL_ALLOWED_BRIDGE_CHAIN_IDS.includes(chainIdToUse)
          ? getNativeAssetForChainId(chainIdToUse)
          : undefined,
        isSwap,
      );
    },
    [openBridgeExperience],
  );

  const setCorrectChain = useCallback(async () => {
    if (
      token.chainId &&
      currentChainId !== token.chainId &&
      !isMultichainAccountsState2Enabled
    ) {
      try {
        const networkConfigurationId = networks[token.chainId];
        await dispatch(setActiveNetworkWithError(networkConfigurationId));
      } catch (err) {
        console.error(`Failed to switch chains.
        Target chainId: ${token.chainId}, Current chainId: ${currentChainId}.
        ${
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          err
        }`);
        throw err;
      }
    }
  }, [
    isMultichainAccountsState2Enabled,
    currentChainId,
    token.chainId,
    networks,
    dispatch,
  ]);

  const handleSwapOnClick = useCallback(async () => {
    if (isUnifiedUIEnabled) {
      handleBridgeOnClick(true);
      return;
    }

    await setCorrectChain();

    if (isSwapsChain) {
      trackEvent({
        event: MetaMetricsEventName.NavSwapButtonClicked,
        category: MetaMetricsEventCategory.Swaps,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: token.symbol,
          location: 'Transaction Shield',
          text: 'Swap',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: token.chainId,
        },
      });
      dispatch(setSwapToToken(token));
      if (usingHardwareWallet) {
        if (global.platform.openExtensionInBrowser) {
          global.platform.openExtensionInBrowser(PREPARE_SWAP_ROUTE);
        }
      } else {
        history.push(PREPARE_SWAP_ROUTE);
      }
    }
  }, [
    isUnifiedUIEnabled,
    setCorrectChain,
    isSwapsChain,
    handleBridgeOnClick,
    trackEvent,
    token,
    dispatch,
    usingHardwareWallet,
    history,
  ]);

  const buttonRow = ({
    label,
    iconName,
    onClick,
    id,
    disabled = false,
  }: {
    label: string;
    iconName: IconName;
    onClick: () => void;
    id: string;
    disabled?: boolean;
  }) => {
    return (
      <Box
        asChild
        data-testid={id}
        className="add-funds-modal__row flex items-center w-full gap-3 p-4"
        onClick={onClick}
      >
        <button disabled={disabled}>
          <Icon
            name={iconName}
            size={IconSize.Lg}
            color={IconColor.IconAlternative}
          />
          <Text variant={TextVariant.BodyMd}>{label}</Text>
        </button>
      </Box>
    );
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      data-testid="add-funds-modal"
      className="add-funds-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onClose}>{t('addFunds')}</ModalHeader>
        <ModalBody
          className="add-funds-modal__body"
          paddingLeft={0}
          paddingRight={0}
        >
          {buttonRow({
            id: 'add-funds-modal-buy-crypto-button',
            label: t('addFundsModalBuyCrypto'),
            iconName: IconName.Add,
            onClick: handleBuyAndSellOnClick,
            disabled: !isBuyableChain,
          })}
          {buttonRow({
            id: 'add-funds-modal-receive-crypto-button',
            label: t('addFundsModalReceiveTokens'),
            iconName: IconName.QrCode,
            onClick: handleReceiveOnClick,
          })}
          {buttonRow({
            id: 'add-funds-modal-swap-crypto-button',
            label: t('addFundsModalSwapTokens'),
            iconName: IconName.SwapHorizontal,
            onClick: handleSwapOnClick,
          })}
          {showReceiveModal && (
            <ReceiveModal
              address={selectedAddress}
              onClose={() => setShowReceiveModal(false)}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default AddFundsModal;
