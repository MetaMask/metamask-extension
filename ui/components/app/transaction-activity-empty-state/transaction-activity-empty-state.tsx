import React, { useCallback, useContext, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { twMerge } from '@metamask/design-system-react';
import { EthMethod } from '@metamask/keyring-api';
import { TabEmptyState } from '../../ui/tab-empty-state';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useTheme } from '../../../hooks/useTheme';
import { getUseExternalServices, getIsSwapsChain } from '../../../selectors';
import { getCurrentChainId } from '../../../../shared/lib/selectors/networks';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsSwapsEventSource,
} from '../../../../shared/constants/metametrics';
import useBridging from '../../../hooks/bridge/useBridging';
import { ThemeType } from '../../../../shared/constants/preferences';
import { getMultichainNetwork } from '../../../selectors/multichain';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { selectAccountGroupBalanceForEmptyState } from '../../../selectors/assets';
import { getSelectedAccountGroup } from '../../../selectors/multichain-accounts/account-tree';
import { FundingMethodModal } from '../../multichain/funding-method-modal/funding-method-modal';
import { getMultichainAccountAddressListReceivePagePath } from '../../../pages/multichain-accounts/multichain-account-address-list-page';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export type TransactionActivityEmptyStateProps = {
  /**
   * Additional className to apply to the component
   */
  className?: string;
};

export const TransactionActivityEmptyState: React.FC<
  TransactionActivityEmptyStateProps
> = ({ className }) => {
  const account = useSelector(getSelectedInternalAccount);
  const t = useI18nContext();
  const theme = useTheme();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);
  const hasTokens = useSelector(selectAccountGroupBalanceForEmptyState);
  const selectedAccountGroup = useSelector(getSelectedAccountGroup);
  const [isFundingModalOpen, setIsFundingModalOpen] = useState(false);

  const isSigningEnabled =
    account.methods.includes(EthMethod.SignTransaction) ||
    account.methods.includes(EthMethod.SignUserOperation);
  const isExternalServicesEnabled = useSelector(getUseExternalServices);
  const chainId = useSelector(getCurrentChainId);
  const isSwapsChain = useSelector((state) => getIsSwapsChain(state, chainId));

  const { chainId: multichainChainId } = useMultichainSelector(
    getMultichainNetwork,
    account,
  );

  const { openBridgeExperience } = useBridging();

  const activityIcon =
    theme === ThemeType.dark
      ? './images/empty-state-activity-dark.png'
      : './images/empty-state-activity-light.png';

  const handleSwapOnClick = useCallback(async () => {
    openBridgeExperience(
      MetaMetricsSwapsEventSource.ActivityTabEmptyState,
      undefined, // No specific token
    );
  }, [openBridgeExperience]);

  const handleAddFundsOnClick = useCallback(() => {
    trackEvent({
      event: MetaMetricsEventName.NavBuyButtonClicked,
      category: MetaMetricsEventCategory.Navigation,
      properties: {
        location: 'Activity Tab Empty State',
        text: 'Add funds',
        chainId,
      },
    });

    setIsFundingModalOpen(true);
  }, [chainId, trackEvent]);

  const handleFundingModalClose = useCallback(() => {
    setIsFundingModalOpen(false);
  }, []);

  const handleReceiveOnClick = useCallback(() => {
    setIsFundingModalOpen(false);

    if (selectedAccountGroup) {
      navigate(
        getMultichainAccountAddressListReceivePagePath(selectedAccountGroup),
      );
    }
  }, [navigate, selectedAccountGroup]);

  const isSwapButtonEnabled =
    multichainChainId === MultichainNetworks.SOLANA ||
    (isSwapsChain && isSigningEnabled && isExternalServicesEnabled);

  return (
    <>
      <TabEmptyState
        icon={
          <img src={activityIcon} alt={t('activity')} width={72} height={72} />
        }
        description={
          hasTokens
            ? t('activityEmptyDescription')
            : t('activityEmptyNoFundsDescription')
        }
        actionButtonText={hasTokens ? t('swapTokens') : t('addFunds')}
        actionButtonProps={
          hasTokens ? { isDisabled: !isSwapButtonEnabled } : undefined
        }
        onAction={hasTokens ? handleSwapOnClick : handleAddFundsOnClick}
        data-testid="activity-tab-empty-state"
        className={twMerge('max-w-56', className)}
      />
      {!hasTokens && (
        <FundingMethodModal
          isOpen={isFundingModalOpen}
          onClose={handleFundingModalClose}
          title={t('addFunds')}
          onClickReceive={handleReceiveOnClick}
          data-testid="activity-tab-empty-state-funding-modal"
        />
      )}
    </>
  );
};
