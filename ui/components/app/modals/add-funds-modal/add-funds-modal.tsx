import React, { useCallback, useContext, useState } from 'react';
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
import { isCaipAssetType, parseCaipAssetType } from '@metamask/utils';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '../../../component-library';
import { getIsNativeTokenBuyable } from '../../../../ducks/ramps';
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
  getSwapsDefaultToken,
} from '../../../../selectors';
import { setSwapsFromToken } from '../../../../ducks/swaps/swaps';
import { isHardwareKeyring } from '../../../../helpers/utils/hardware';
import { MetaMetricsContext } from '../../../../contexts/metametrics';

const AddFundsModal = ({
  onClose,
  tokenSymbol,
}: {
  onClose: () => void;
  tokenSymbol: string;
}) => {
  const t = useI18nContext();
  const { openBuyCryptoInPdapp } = useRamps();
  const history = useHistory();
  const dispatch = useDispatch();
  const trackEvent = useContext(MetaMetricsContext);

  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring?.type);

  // FIXME: This causes re-renders, so use isEqual to avoid this
  const account = useSelector(getSelectedInternalAccount, isEqual);
  const { address: selectedAddress } = account;

  const isBuyableChain = useSelector(getIsNativeTokenBuyable);
  const chainId = useSelector(getCurrentChainId);

  // Multichain accounts feature flag and selected account group
  const isMultichainAccountsState2Enabled = useSelector(
    getIsMultichainAccountsState2Enabled,
  );
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);

  const { openBridgeExperience } = useBridging();
  const isUnifiedUIEnabled = useSelector(getIsUnifiedUIEnabled);
  const isSwapsChain = useSelector(getIsSwapsChain);

  const defaultSwapsToken = useSelector((state) =>
    getSwapsDefaultToken(state, chainId.toString()),
  );

  const [showReceiveModal, setShowReceiveModal] = useState(false);

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
        chain_id: chainId,
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        token_symbol: tokenSymbol,
      },
    });
  }, [chainId, openBuyCryptoInPdapp, tokenSymbol, trackEvent]);

  const handleReceiveOnClick = useCallback(() => {
    if (isMultichainAccountsState2Enabled && selectedAccountGroup) {
      // Navigate to the multichain address list page with receive source
      history.push(
        `${MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE}/${encodeURIComponent(selectedAccountGroup)}?${AddressListQueryParams.Source}=${AddressListSource.Receive}`,
      );
    } else {
      // Show the traditional receive modal
      setShowReceiveModal(true);
    }
  }, [isMultichainAccountsState2Enabled, selectedAccountGroup, history]);

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

  const handleSwapOnClick = useCallback(async () => {
    if (isUnifiedUIEnabled) {
      handleBridgeOnClick(true);
      return;
    }

    if (isSwapsChain) {
      dispatch(setSwapsFromToken(defaultSwapsToken));
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
    isSwapsChain,
    handleBridgeOnClick,
    dispatch,
    defaultSwapsToken,
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
        <ModalBody className="add-funds-modal__body">
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
