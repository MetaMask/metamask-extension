import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type Hex } from '@metamask/utils';
import { TransactionType } from '@metamask/transaction-controller';
import log from 'loglevel';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonBase,
  ButtonIcon,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  closeNotificationFromPopup,
  upsertTransactionUIMetricsFragment,
} from '../../../store/actions';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes';
import { ScrollContainer } from '../../../contexts/scroll-container';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import { updateTransactionPaymentToken } from '../../../store/controller-actions/transaction-pay-controller';
import { TokenIcon } from '../../../pages/confirmations/components/token-icon/token-icon';
import { useSendTokens } from '../../../pages/confirmations/hooks/send/useSendTokens';
import { ConfirmationLoader } from '../../../pages/confirmations/hooks/useConfirmationNavigation';
import { selectBlockedPayTokens } from '../../../pages/confirmations/selectors/feature-flags';
import { getAvailableTokens } from '../../../pages/confirmations/utils/transaction-pay';
import { Asset } from '../../../pages/confirmations/components/send/asset/asset';
import type { Asset as AssetType } from '../../../pages/confirmations/types/send';
import { usePerpsHomeRoute } from '../../../hooks/perps/usePerpsHomeRoute';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { usePerpsDepositConfirmation } from '../perps/hooks/usePerpsDepositConfirmation';
import { PERPS_EVENT_VALUE } from '../../../../shared/constants/perps-events';
import { HYPERLIQUID_DEPOSIT_PROMPT } from '../../../../shared/constants/hyperliquid-deposit-prompt';
import type {
  HyperliquidDepositPromptProps,
  HyperliquidDepositPromptAction,
} from './hyperliquid-deposit-prompt.types';

/**
 * Appends `source=hyperliquid_deposit_prompt` to the perps home route so the
 * landing PERPS_SCREEN_VIEWED event carries this attribution.
 * @param perpsHomeRoute
 */
function buildGoBackToWithSource(perpsHomeRoute: string): string {
  const separator = perpsHomeRoute.includes('?') ? '&' : '?';
  return `${perpsHomeRoute}${separator}source=${PERPS_EVENT_VALUE.SOURCE.HYPERLIQUID_DEPOSIT_PROMPT}`;
}

/**
 * Tokens the user can fund a Hyperliquid deposit with through MetaMask Pay.
 *
 * Uses the same filtering logic as the Perps deposit confirmation's PayWithModal:
 * - `useSendTokens()` sources wallet tokens (native + ERC-20)
 * - `selectBlockedPayTokens` applies the LaunchDarkly blocklist
 * - `getAvailableTokens` filters to EVM mainnets with positive balance
 *
 * The blocklist is keyed by `TransactionType.perpsDeposit` since this prompt
 * hands off to that flow.
 */
function useHyperliquidDepositTokens(): AssetType[] {
  const tokens = useSendTokens();
  const blockedTokens = useSelector((state) =>
    selectBlockedPayTokens(state, TransactionType.perpsDeposit),
  );

  return useMemo(
    () => getAvailableTokens({ tokens, blockedTokens }),
    [blockedTokens, tokens],
  );
}

const LogoPair: React.FC = () => {
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={4}
      aria-label="MetaMask and Hyperliquid"
      role="img"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        className="size-16 rounded-2xl bg-muted"
      >
        <img
          alt=""
          data-testid="hyperliquid-deposit-prompt-metamask-logo"
          className="size-10"
          src="./images/logo/metamask-fox.svg"
        />
      </Box>
      <Box flexDirection={BoxFlexDirection.Row} gap={1} aria-hidden="true">
        <Box className="size-1 rounded-full bg-icon-muted" />
        <Box className="size-1 rounded-full bg-icon-muted" />
        <Box className="size-1 rounded-full bg-icon-muted" />
      </Box>
      <img
        alt=""
        data-testid="hyperliquid-deposit-prompt-hyperliquid-logo"
        className="size-16 rounded-2xl"
        src="./images/hyperevm.svg"
      />
    </Box>
  );
};

const TokenSelectButton: React.FC<{
  onClick: () => void;
  token?: AssetType;
}> = ({ onClick, token }) => {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();

  return (
    <ButtonBase
      data-testid="hyperliquid-deposit-prompt-token-select"
      onClick={onClick}
      isFullWidth
      className="h-auto justify-between rounded-xl bg-muted px-4 py-3"
    >
      {token ? (
        <>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={3}
          >
            <TokenIcon
              chainId={token.chainId as Hex}
              tokenAddress={token.address as Hex}
              symbol={token.symbol}
              size="md"
            />
            <Text data-testid="hyperliquid-deposit-prompt-token-name">
              {token.name ?? token.symbol}
            </Text>
          </Box>
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={2}
          >
            <Text data-testid="hyperliquid-deposit-prompt-token-balance">
              {formatFiat(token.fiat?.balance ?? 0)}
            </Text>
            <Icon
              name={IconName.ArrowDown}
              size={IconSize.Md}
              color={IconColor.IconAlternative}
            />
          </Box>
        </>
      ) : (
        <Text color={TextColor.TextAlternative}>{t('swapSelectToken')}</Text>
      )}
    </ButtonBase>
  );
};

export const HyperliquidDepositPrompt: React.FC<
  HyperliquidDepositPromptProps
> = ({ onActionComplete, selectedAddress }) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const perpsHomeRoute = usePerpsHomeRoute();
  const tokens = useHyperliquidDepositTokens();
  const currentAccount = useSelector(getSelectedInternalAccount);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const hasTrackedView = useRef(false);

  const isSignerMismatch = Boolean(
    selectedAddress &&
    currentAccount?.address &&
    selectedAddress.toLowerCase() !== currentAccount.address.toLowerCase(),
  );

  const trackPromptInteracted = useCallback(
    (action: HyperliquidDepositPromptAction) => {
      trackEvent(
        createEventBuilder(
          MetaMetricsEventName.HyperliquidDepositPromptInteracted,
        )
          .addCategory(MetaMetricsEventCategory.Confirmations)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            interaction_type: action,
          })
          .build(),
      );
    },
    [createEventBuilder, trackEvent],
  );

  // Dismiss if the signer account isn't the currently selected account as
  // useSendTokens and usePerpsDepositConfirmation use the selected account.
  useEffect(() => {
    if (isSignerMismatch) {
      onActionComplete({ action: 'dismiss' });
    }
  }, [isSignerMismatch, onActionComplete]);

  // When this component renders in the popup, close any notification window.
  // This is to prevent an open notification window from showing the same approval.
  useEffect(() => {
    closeNotificationFromPopup().catch(() => {
      // Ignore errors - notification may not be open
    });
  }, []);

  useEffect(() => {
    if (isSignerMismatch || hasTrackedView.current) {
      return;
    }

    hasTrackedView.current = true;
    trackEvent(
      createEventBuilder(MetaMetricsEventName.HyperliquidDepositPromptViewed)
        .addCategory(MetaMetricsEventCategory.Confirmations)
        .build(),
    );
  }, [createEventBuilder, isSignerMismatch, trackEvent]);

  // The same entry point the Perps "Add funds" button uses. It creates the
  // unapproved draft transaction that backs the Perps deposit confirmation;
  // no deposit happens until the user confirms an amount on that screen.
  // Navigation is deferred so the payment token can be pre-selected first.
  const { isLoading: isStartingDeposit, trigger: startPerpsDeposit } =
    usePerpsDepositConfirmation({
      navigateOnCreate: false,
      entryPoint: HYPERLIQUID_DEPOSIT_PROMPT,
    });

  const [selectedToken, setSelectedToken] = useState<AssetType>();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const selectableTokens = useMemo(
    () => tokens.filter((token) => !token.disabled),
    [tokens],
  );

  const displayToken = selectedToken ?? selectableTokens[0];

  const handleClose = useCallback(() => {
    trackPromptInteracted('dismiss');
    onActionComplete({ action: 'dismiss' });
  }, [onActionComplete, trackPromptInteracted]);

  const handleTokenSelect = useCallback((token: AssetType) => {
    if (token.disabled) {
      return;
    }

    setSelectedToken(token);
    setIsPickerOpen(false);
  }, []);

  const handleContinue = useCallback(async () => {
    setHasError(false);

    const result = await startPerpsDeposit();

    if (!result) {
      setHasError(true);
      return;
    }

    const { transactionId } = result;

    upsertTransactionUIMetricsFragment(transactionId, {
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        mm_pay_entry_point: HYPERLIQUID_DEPOSIT_PROMPT,
      },
    });

    if (displayToken?.address && displayToken.chainId) {
      try {
        await updateTransactionPaymentToken({
          transactionId,
          tokenAddress: displayToken.address as Hex,
          chainId: displayToken.chainId as Hex,
        });
      } catch (error) {
        // The confirmation falls back to its automatic pay token selection,
        // so a failed pre-selection should not block the deposit.
        log.error(
          'HyperliquidDepositPrompt: Failed to pre-select payment token',
          error,
        );
      }
    }

    navigate(
      {
        pathname: `${CONFIRM_TRANSACTION_ROUTE}/${transactionId}`,
        search: new URLSearchParams({
          loader: ConfirmationLoader.CustomAmount,
          goBackTo: buildGoBackToWithSource(perpsHomeRoute),
        }).toString(),
      },
      { replace: true },
    );

    trackPromptInteracted('continue');
    onActionComplete({ action: 'continue', transactionId });
  }, [
    displayToken,
    navigate,
    onActionComplete,
    perpsHomeRoute,
    startPerpsDeposit,
    trackPromptInteracted,
  ]);

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      className="h-full"
      data-testid="hyperliquid-deposit-prompt"
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        justifyContent={BoxJustifyContent.End}
      >
        <ButtonIcon
          iconName={IconName.Close}
          ariaLabel={t('close')}
          data-testid="hyperliquid-deposit-prompt-close"
          onClick={handleClose}
        />
      </Box>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        gap={4}
        className="pt-8"
      >
        <LogoPair />
        <Text
          variant={TextVariant.HeadingLg}
          className="max-w-[240px] text-center"
        >
          {t('hyperliquidDepositPromptTitle')}
        </Text>
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.TextAlternative}
          className="mt-2"
        >
          {t('hyperliquidDepositPromptDescription')}
        </Text>
      </Box>
      <Box flexDirection={BoxFlexDirection.Column} gap={2} className="pt-8">
        <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
          {t('payWith')}
        </Text>
        <TokenSelectButton
          token={displayToken}
          onClick={() => setIsPickerOpen(true)}
        />
      </Box>
      <Box className="flex-1" />
      {hasError && (
        <Text
          variant={TextVariant.BodySm}
          color={TextColor.ErrorDefault}
          className="pb-2 text-center"
          data-testid="hyperliquid-deposit-prompt-error"
        >
          {t('somethingWentWrong')}
        </Text>
      )}
      <Box flexDirection={BoxFlexDirection.Column} gap={4}>
        <Button
          data-testid="hyperliquid-deposit-prompt-continue"
          onClick={handleContinue}
          isLoading={isStartingDeposit}
          isDisabled={!displayToken || isStartingDeposit}
          isFullWidth
        >
          {t('continue')}
        </Button>
        <Button
          data-testid="hyperliquid-deposit-prompt-no-thanks"
          variant={ButtonVariant.Tertiary}
          onClick={handleClose}
          isDisabled={isStartingDeposit}
          isFullWidth
        >
          {t('hyperliquidDepositPromptNoThanks')}
        </Button>
      </Box>
      <Modal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        isClosedOnOutsideClick={false}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onClose={() => setIsPickerOpen(false)}
            closeButtonProps={{
              ariaLabel: t('close'),
              'data-testid': 'hyperliquid-deposit-picker-close',
            }}
          >
            {t('payWithModalTitle')}
          </ModalHeader>
          <ScrollContainer className="flex-1 overflow-auto">
            <Asset
              tokens={tokens}
              nfts={[]}
              hideNfts
              disableMetrics
              onAssetSelect={handleTokenSelect}
            />
          </ScrollContainer>
        </ModalContent>
      </Modal>
    </Box>
  );
};
