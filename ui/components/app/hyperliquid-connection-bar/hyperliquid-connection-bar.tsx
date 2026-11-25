import React, { useCallback, useId, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { HYPERLIQUID_DEPOSIT_PROMPT } from '../../../../shared/constants/hyperliquid-deposit-prompt';
import { PERPS_EVENT_VALUE } from '../../../../shared/constants/perps-events';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PerpsMarketBalanceActions } from '../perps/perps-market-balance-actions';
import { usePerpsDepositConfirmation } from '../perps/hooks/usePerpsDepositConfirmation';
import { usePerpsWithdrawNavigation } from '../perps/hooks/usePerpsWithdrawNavigation';

/**
 * Hyperliquid Connection Bar: the Perps balance with Add funds and Withdraw,
 * attached above the dapp connection bar while the active tab is Hyperliquid.
 * It slides up from behind the dapp connection bar when it mounts, so users
 * notice it, and is removed without animation when it unmounts.
 */
const HyperliquidConnectionBar = () => {
  const t = useI18nContext();
  const contentId = useId();
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation({
    entryPoint: HYPERLIQUID_DEPOSIT_PROMPT,
  });
  const { trigger: triggerWithdraw } = usePerpsWithdrawNavigation();
  const [isExpanded, setIsExpanded] = useState(true);

  const handleToggle = useCallback(() => {
    setIsExpanded((expanded) => !expanded);
  }, []);

  return (
    <Box className="pointer-events-none -mt-6 overflow-hidden pt-6">
      <Box
        flexDirection={BoxFlexDirection.Column}
        padding={3}
        paddingLeft={4}
        className="pointer-events-auto relative isolate w-full rounded-t-3xl bg-default [[data-theme=dark]_&]:bg-[var(--color-background-elevated1)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-t-3xl before:shadow-[0_-8px_16px_-6px_var(--color-shadow-default)] before:[animation:bar-shadow-fade-in_500ms_ease-out_backwards] [animation:slide-up-from-below_550ms_cubic-bezier(0.22,1,0.36,1)_backwards] motion-reduce:[animation:none] motion-reduce:before:[animation:none]"
        data-testid="hyperliquid-connection-bar"
      >
        <Box
          asChild
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Between}
          gap={4}
          className="group w-full cursor-pointer"
        >
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={contentId}
            data-expanded={isExpanded}
            onClick={handleToggle}
            data-testid="hyperliquid-connection-bar-toggle"
          >
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.TextDefault}
              data-testid="hyperliquid-connection-bar-header"
            >
              {t('perpsBalance')}
            </Text>
            <Icon
              name={IconName.ArrowDown}
              size={IconSize.Sm}
              className="mr-1 transition-transform duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[expanded=false]:rotate-180 motion-reduce:transition-none"
            />
          </button>
        </Box>
        <Box
          id={contentId}
          className="invisible grid grid-rows-[0fr] opacity-0 transition-[grid-template-rows,opacity,visibility] duration-[240ms] ease-[cubic-bezier(0.22,1,0.36,1)] data-[expanded=true]:visible data-[expanded=true]:grid-rows-[1fr] data-[expanded=true]:opacity-100 motion-reduce:transition-[opacity,visibility]"
          data-expanded={isExpanded}
          data-testid="hyperliquid-connection-bar-content"
        >
          <Box className="min-h-0 [overflow-clip-margin:4px] [overflow:clip]">
            <Box paddingTop={2}>
              <PerpsMarketBalanceActions
                variant="compact"
                buttonLocation={
                  PERPS_EVENT_VALUE.BUTTON_LOCATION.HYPERLIQUID_CONNECTION_BAR
                }
                onAddFunds={triggerDeposit}
                onWithdraw={triggerWithdraw}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default HyperliquidConnectionBar;
