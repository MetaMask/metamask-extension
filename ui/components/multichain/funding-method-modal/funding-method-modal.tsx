import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { CaipChainId, Hex } from '@metamask/utils';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Text,
  IconName,
  type ModalProps,
} from '../../component-library';
import {
  TextVariant,
  TextAlign,
} from '../../../helpers/constants/design-system';
import {
  getMultichainCurrentNetwork,
  getMultichainDefaultToken,
} from '../../../selectors/multichain';
import { RampsMetaMaskEntry } from '../../../hooks/ramps/useRamps/useRamps';
import useRampsNavigation from '../../../hooks/ramps/useRampsNavigation/useRampsNavigation';
import { getPortfolioUrl } from '../../../helpers/utils/portfolio';
import {
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
  getDataCollectionForMarketing,
  getSelectedAccount,
} from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import FundingMethodItem from './funding-method-item';

type FundingMethodModalProps = Omit<ModalProps, 'children'> & {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onClickReceive: () => void;
};

export const FundingMethodModal = ({
  isOpen,
  onClose,
  title,
  onClickReceive,
  ...props
}: FundingMethodModalProps) => {
  const t = useI18nContext();
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { goToBuy } = useRampsNavigation();
  const { address: accountAddress } = useSelector(getSelectedAccount);
  const { chainId } = useSelector(getMultichainCurrentNetwork);
  const { symbol } = useSelector(getMultichainDefaultToken);
  const analyticsId = useSelector(getAnalyticsId);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isOptedIn = useSelector(getOptedIn);
  const isMetaMetricsEnabled = completedMetaMetricsOnboarding && isOptedIn;
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const handleTransferCryptoClick = useCallback(() => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NavSendButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: RampsMetaMaskEntry?.TokensBanner,
          text: 'Transfer crypto',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: symbol,
        })
        .build(),
    );

    const url = getPortfolioUrl(
      'transfer',
      'ext_funding_method_modal',
      analyticsId,
      isMetaMetricsEnabled === true,
      isMarketingEnabled === true,
      accountAddress,
      'transfer',
    );
    global.platform.openTab({ url });
  }, [
    analyticsId,
    isMetaMetricsEnabled,
    isMarketingEnabled,
    chainId,
    symbol,
    accountAddress,
    trackEvent,
    createEventBuilder,
  ]);

  const handleBuyCryptoClick = useCallback(async () => {
    const opened = await goToBuy({ chainId: chainId as Hex | CaipChainId });
    // The ramps gate can block the buy (e.g. service disruption, unsupported
    // region) and show its own modal; don't report a buy click in that case.
    if (!opened) {
      return;
    }
    trackEvent(
      createEventBuilder(MetaMetricsEventName.NavBuyButtonClicked)
        .addCategory(MetaMetricsEventCategory.Navigation)
        .addProperties({
          location: RampsMetaMaskEntry?.TokensBanner,
          text: 'Buy crypto',
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          chain_id: chainId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: symbol,
        })
        .build(),
    );
  }, [chainId, symbol, trackEvent, createEventBuilder, goToBuy]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader paddingBottom={2} onClose={onClose}>
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {title}
          </Text>
        </ModalHeader>
        <FundingMethodItem
          icon={IconName.Card}
          title={t('tokenMarketplace')}
          description={t('debitCreditPurchaseOptions')}
          onClick={handleBuyCryptoClick}
        />
        <FundingMethodItem
          icon={IconName.Received}
          title={t('receiveCrypto')}
          description={t('depositCrypto')}
          onClick={onClickReceive}
        />
        <FundingMethodItem
          icon={IconName.Link}
          title={t('transferCrypto')}
          description={t('linkCentralizedExchanges')}
          onClick={handleTransferCryptoClick}
        />
      </ModalContent>
    </Modal>
  );
};
