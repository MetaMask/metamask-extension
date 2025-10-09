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
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { isEqual } from 'lodash';
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
import { MULTICHAIN_ACCOUNT_ADDRESS_LIST_PAGE_ROUTE } from '../../../../helpers/constants/routes';
import {
  AddressListQueryParams,
  AddressListSource,
} from '../../../../pages/multichain-accounts/multichain-account-address-list-page';
import { ReceiveModal } from '../../../multichain/receive-modal';
import { getSelectedInternalAccount } from '../../../../selectors/accounts';
import useBridging from '../../../../hooks/bridge/useBridging';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../../shared/constants/metametrics';
import { getCurrentKeyring } from '../../../../selectors';
import { MetaMetricsContext } from '../../../../contexts/metametrics';
import { hexToDecimal } from '../../../../../shared/modules/conversion.utils';
import { AggregatorNetwork } from '../../../../ducks/ramps/types';
import { trace, TraceName } from '../../../../../shared/lib/trace';

const AddFundsModal = ({
  onClose,
  token,
}: {
  onClose: () => void;
  token: TokenPaymentInfo & {
    chainId: string | number;
  };
}) => {
  const t = useI18nContext();
  const { openBuyCryptoInPdapp } = useRamps();
  const history = useHistory();
  const trackEvent = useContext(MetaMetricsContext);

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

  const handleSwapOnClick = useCallback(async () => {
    openBridgeExperience(MetaMetricsSwapsEventSource.TransactionShield, {
      symbol: token.symbol,
      address: token.address,
      chainId: token.chainId,
    });
  }, [token, openBridgeExperience]);

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
