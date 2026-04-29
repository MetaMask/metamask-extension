import {
  TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetaMetricsEventLocation } from '../../../../../../shared/constants/metametrics';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../../components/component-library';
import { Footer as PageFooter } from '../../../../../components/multichain/pages/page';
import {
  Display,
  FlexDirection,
} from '../../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../../helpers/constants/routes';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';
import { useConfirmContext } from '../../../context/confirm';
import { useIsGaslessLoading } from '../../../hooks/gas/useIsGaslessLoading';
import { useEnableShieldCoverageChecks } from '../../../hooks/transactions/useEnableShieldCoverageChecks';
import { useConfirmActions } from '../../../hooks/useConfirmActions';
import { useDappSwapActions } from '../../../hooks/transactions/dapp-swap-comparison/useDappSwapActions';
import { useOriginThrottling } from '../../../hooks/useOriginThrottling';
import { isAddEthereumChainType } from '../../../hooks/useAddEthereumChain';
import { isSignatureTransactionType } from '../../../utils';
import {
  useHardwareWalletConfig,
  useHardwareWalletError,
} from '../../../../../contexts/hardware-wallets';
import OriginThrottleModal from './origin-throttle-modal';
import ShieldFooterAgreement from './shield-footer-agreement';
import ShieldFooterCoverageIndicator from './shield-footer-coverage-indicator/shield-footer-coverage-indicator';
import { SingleActionFooter } from './single-action-footer';
import { HardwareWalletActionButton } from './hardware-wallet-footer';
import { ConfirmButton } from './confirm-button';
import { useConfirmationSubmit } from './useConfirmationSubmit';

export type { OnCancelHandler } from './confirm-button';

const SINGLE_ACTION_FOOTER_TYPES = [
  TransactionType.musdConversion,
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
];

export const CancelButton = ({
  handleFooterCancel,
}: {
  handleFooterCancel: () => void;
}) => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  if (currentConfirmation?.type === TransactionType.shieldSubscriptionApprove) {
    return null;
  }

  return (
    <Button
      block
      data-testid="confirm-footer-cancel-button"
      onClick={handleFooterCancel}
      size={ButtonSize.Lg}
      variant={ButtonVariant.Secondary}
    >
      {t('cancel')}
    </Button>
  );
};

const Footer = () => {
  const navigate = useNavigate();
  const { onDappSwapCompleted } = useDappSwapActions();
  const { navigateNext } = useConfirmationNavigation();

  const { currentConfirmation, isScrollToBottomCompleted, goBackTo } =
    useConfirmContext<TransactionMeta>();
  const currentConfirmationId = currentConfirmation?.id;
  const { isGaslessLoading } = useIsGaslessLoading();

  const { shouldThrottleOrigin } = useOriginThrottling();
  const [showOriginThrottleModal, setShowOriginThrottleModal] = useState(false);
  const { onCancel } = useConfirmActions();

  const { isHardwareWalletAccount } = useHardwareWalletConfig();
  const { dismissErrorModal, setErrorModalSuppressed } =
    useHardwareWalletError();

  useEffect(() => {
    return () => {
      setErrorModalSuppressed(false);
    };
  }, [setErrorModalSuppressed]);

  const isSignature = isSignatureTransactionType(currentConfirmation);
  const isAddEthereumChain = isAddEthereumChainType(currentConfirmation);

  const isConfirmDisabled =
    (!isScrollToBottomCompleted && !isSignature) || isGaslessLoading;

  const onSubmit = useConfirmationSubmit();

  const handleFooterCancel = useCallback(async () => {
    if (shouldThrottleOrigin) {
      setShowOriginThrottleModal(true);
      return;
    }

    await onCancel({
      location: MetaMetricsEventLocation.Confirmation,
      navigateBackToPreviousPage: Boolean(goBackTo),
    });

    onDappSwapCompleted();
    dismissErrorModal();

    if (goBackTo) {
      return;
    }

    if (isAddEthereumChain) {
      navigate(DEFAULT_ROUTE);
      return;
    }

    if (currentConfirmationId) {
      navigateNext(currentConfirmationId);
    }
  }, [
    navigateNext,
    onCancel,
    goBackTo,
    shouldThrottleOrigin,
    currentConfirmationId,
    isAddEthereumChain,
    navigate,
    onDappSwapCompleted,
    dismissErrorModal,
  ]);

  const { isShowCoverageIndicator } = useEnableShieldCoverageChecks();

  if (!currentConfirmation) {
    return null;
  }

  if (
    currentConfirmation.type &&
    SINGLE_ACTION_FOOTER_TYPES.includes(currentConfirmation.type)
  ) {
    return (
      <SingleActionFooter
        onSubmit={onSubmit}
        isGaslessLoading={isGaslessLoading}
        isHardwareWalletAccount={isHardwareWalletAccount}
      />
    );
  }

  return (
    <>
      <ShieldFooterCoverageIndicator />
      <PageFooter
        className="confirm-footer_page-footer"
        flexDirection={FlexDirection.Column}
        // box shadow to match the original var(--shadow-size-md) on the footer,
        // but only applied to the bottom of the box, so it doesn't overlap with
        // the shield footer coverage indicator
        style={
          isShowCoverageIndicator
            ? { boxShadow: '0 4px 16px -8px var(--color-shadow-default)' }
            : undefined
        }
      >
        <OriginThrottleModal
          isOpen={showOriginThrottleModal}
          onConfirmationCancel={onCancel}
        />
        <Box display={Display.Flex} flexDirection={FlexDirection.Row} gap={4}>
          <CancelButton handleFooterCancel={handleFooterCancel} />
          {isHardwareWalletAccount ? (
            <HardwareWalletActionButton disabled={isConfirmDisabled} />
          ) : (
            <ConfirmButton
              alertOwnerId={currentConfirmation?.id}
              onSubmit={onSubmit}
              disabled={isConfirmDisabled}
              onCancel={onCancel}
            />
          )}
        </Box>
        <ShieldFooterAgreement />
      </PageFooter>
    </>
  );
};

export default Footer;
