import React, { memo, useEffect, useRef, useState } from 'react';
import {
  Box,
  BoxFlexDirection,
  ButtonSize,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PerpsMarketBalanceActions } from '../perps/perps-market-balance-actions';
import { usePerpsDepositConfirmation } from '../perps/hooks/usePerpsDepositConfirmation';
import { usePerpsWithdrawNavigation } from '../perps/hooks/usePerpsWithdrawNavigation';

/** Keep in step with the slide-up duration in the dapp-bar stylesheet. */
const SLIDE_DURATION_MS = 800;

/**
 * Sheet attached above the dapp connection bar while the active tab is
 * Hyperliquid. Shows a "Perps balance" header, the balance, and
 * Withdraw and Add funds on the balance row. The header toggles the balance
 * details.
 * The sheet slides up from behind the bar as soon as it mounts, even if the
 * balance is still loading. The balance and actions appear together.
 */
export const HyperliquidDappBarDepositSheet = memo(() => {
  const t = useI18nContext();
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation();
  const { trigger: triggerWithdraw } = usePerpsWithdrawNavigation();
  // PROTOTYPE: fold/expand the sheet.
  const [isExpanded, setIsExpanded] = useState(true);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Clip the stack only while the sheet is translating up, so the portion
  // still below the bar is hidden. The bar's higher z-index covers the rest.
  // The stack's top padding keeps the upward shadow inside that clip, and the
  // slide keyframes fade the shadow in, so removing the clip does not pop it.
  useEffect(() => {
    const stack = sheetRef.current?.parentElement;
    if (!stack?.classList.contains('hyperliquid-dapp-bar-sheet-stack')) {
      return undefined;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    stack.classList.add('hyperliquid-dapp-bar-sheet-stack--clip');
    const timeoutId = setTimeout(() => {
      stack.classList.remove('hyperliquid-dapp-bar-sheet-stack--clip');
    }, SLIDE_DURATION_MS);
    return () => {
      clearTimeout(timeoutId);
      stack.classList.remove('hyperliquid-dapp-bar-sheet-stack--clip');
    };
  }, []);

  return (
    <Box
      ref={sheetRef}
      className="hyperliquid-dapp-bar-deposit-sheet"
      flexDirection={BoxFlexDirection.Column}
      data-testid="hyperliquid-dapp-bar-deposit-sheet"
    >
      <button
        type="button"
        className="hyperliquid-dapp-bar-deposit-sheet__header-row"
        data-testid="hyperliquid-dapp-bar-deposit-sheet__header-row"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((expanded) => !expanded)}
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
          className="hyperliquid-dapp-bar-deposit-sheet__header"
          data-testid="hyperliquid-dapp-bar-deposit-sheet__header"
        >
          {t('perpsBalance')}
        </Text>
        <div
          className={`hyperliquid-dapp-bar-deposit-sheet__controls${
            isExpanded
              ? ''
              : ' hyperliquid-dapp-bar-deposit-sheet__controls--collapsed'
          }`}
        >
          <Icon
            name={IconName.ArrowDown}
            size={IconSize.Sm}
            data-testid="hyperliquid-dapp-bar-deposit-sheet__toggle"
          />
        </div>
      </button>
      <div
        className={`hyperliquid-dapp-bar-deposit-sheet__content${
          isExpanded
            ? ' hyperliquid-dapp-bar-deposit-sheet__content--expanded'
            : ''
        }`}
        aria-hidden={!isExpanded}
        data-testid="hyperliquid-dapp-bar-deposit-sheet__content"
        // React 18 has no `inert` prop; the empty attribute enables it.
        {...(isExpanded ? {} : ({ inert: '' } as object))}
      >
        <div className="hyperliquid-dapp-bar-deposit-sheet__content-inner">
          <div
            className="hyperliquid-dapp-bar-deposit-sheet__row"
            data-testid="hyperliquid-dapp-bar-deposit-sheet__row"
          >
            <Box className="hyperliquid-dapp-bar-deposit-sheet__body">
              <PerpsMarketBalanceActions
                showActionButtons
                actionButtonSize={ButtonSize.Sm}
                actionsPlacement="beside"
                onAddFunds={triggerDeposit}
                onWithdraw={triggerWithdraw}
              />
            </Box>
          </div>
        </div>
      </div>
    </Box>
  );
});

HyperliquidDappBarDepositSheet.displayName = 'HyperliquidDappBarDepositSheet';
