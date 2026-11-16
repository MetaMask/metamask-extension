import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconAlert,
  IconAlertSeverity,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { usePerpsLiveAccount } from '../../../hooks/perps/stream';
import { PerpsMarketBalanceActions } from '../perps/perps-market-balance-actions';
import { usePerpsDepositConfirmation } from '../perps/hooks/usePerpsDepositConfirmation';
import { usePerpsWithdrawNavigation } from '../perps/hooks/usePerpsWithdrawNavigation';

const SETTINGS_PATH = 'Settings > Preferences';

/** Keep in step with the slide-up duration in the dapp-bar stylesheet. */
const SLIDE_DURATION_MS = 800;

type HidePerpsBalanceConfirmDialogProps = {
  onClose: () => void;
};

/**
 * Confirm dialog matching the X (cashtag) widget disable confirmation:
 * warning icon, centered title and body, Cancel and Disable.
 * Confirm and cancel only close the dialog.
 *
 * @param props
 * @param props.onClose
 */
const HidePerpsBalanceConfirmDialog = ({
  onClose,
}: HidePerpsBalanceConfirmDialogProps) => {
  const t = useI18nContext();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const description = t('hidePerpsBalanceOnDappConnectionDescription');
  const settingsPathIndex = description.indexOf(SETTINGS_PATH);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    try {
      if (!dialog.open) {
        dialog.showModal();
      }
    } catch {
      dialog.open = true;
    }

    return () => {
      if (dialog.open) {
        dialog.close();
      }
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="w-[360px] max-w-[calc(100vw-32px)] rounded-xl border border-muted bg-default p-4 font-sans text-default shadow-lg"
      data-testid="hyperliquid-dapp-bar-deposit-sheet__disable-dialog"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="relative flex flex-col items-center">
        <ButtonIcon
          ariaLabel={t('close')}
          iconName={IconName.Close}
          className="absolute right-0 top-0 text-icon-default hover:bg-muted-hover"
          onClick={onClose}
          data-testid="hyperliquid-dapp-bar-deposit-sheet__disable-close"
        />
        <IconAlert severity={IconAlertSeverity.Warning} size={IconSize.Xl} />
        <h2
          id={titleId}
          className="mt-4 mb-0 text-center text-s-heading-sm font-medium text-default"
        >
          {t('hidePerpsBalanceOnDappConnectionTitle')}
        </h2>
        <p
          id={descriptionId}
          className="mt-2 mb-0 text-center text-s-body-md text-alternative"
        >
          {settingsPathIndex === -1 ? (
            description
          ) : (
            <>
              {description.slice(0, settingsPathIndex)}
              <span className="font-medium text-default whitespace-nowrap">
                {SETTINGS_PATH}
              </span>
              {description.slice(settingsPathIndex + SETTINGS_PATH.length)}
            </>
          )}
        </p>
        <div className="mt-6 grid w-full grid-cols-2 gap-4">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onClose}
            data-testid="hyperliquid-dapp-bar-deposit-sheet__disable-cancel"
          >
            {t('cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={onClose}
            data-testid="hyperliquid-dapp-bar-deposit-sheet__disable-confirm"
          >
            {t('disable')}
          </Button>
        </div>
      </div>
    </dialog>
  );
};

/**
 * Sheet attached above the dapp connection bar while the active tab is
 * Hyperliquid. Shows a "Hyperliquid balance" header, the Perps balance, and
 * Withdraw and Add funds on the balance row. There is no manual collapse.
 * The sheet slides up from behind the bar as soon as it mounts, even if the
 * balance is still loading. Loading fills in on the same mounted sheet, so
 * the slide does not replay.
 */
export const HyperliquidDappBarDepositSheet = memo(() => {
  const t = useI18nContext();
  const { isInitialLoading } = usePerpsLiveAccount();
  const { trigger: triggerDeposit } = usePerpsDepositConfirmation();
  const { trigger: triggerWithdraw } = usePerpsWithdrawNavigation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const menuId = useId();
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

  const handleToggleMenu = useCallback(() => {
    setIsMenuOpen((open) => !open);
  }, []);

  const handleDisableClick = useCallback(() => {
    setIsMenuOpen(false);
    setIsConfirmOpen(true);
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setIsConfirmOpen(false);
  }, []);

  return (
    <Box
      ref={sheetRef}
      className="hyperliquid-dapp-bar-deposit-sheet"
      flexDirection={BoxFlexDirection.Column}
      data-testid="hyperliquid-dapp-bar-deposit-sheet"
    >
      <div
        className="hyperliquid-dapp-bar-deposit-sheet__header-row"
        data-testid="hyperliquid-dapp-bar-deposit-sheet__header-row"
      >
        <Text
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextDefault}
          className="hyperliquid-dapp-bar-deposit-sheet__header"
          data-testid="hyperliquid-dapp-bar-deposit-sheet__header"
        >
          {t('hyperliquidDepositSheetBalanceHeader')}
        </Text>
        <div className="hyperliquid-dapp-bar-deposit-sheet__controls">
          <div className="relative">
            <ButtonIcon
              iconName={IconName.MoreVertical}
              size={ButtonIconSize.Sm}
              ariaLabel={t('options')}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
              aria-controls={menuId}
              onClick={handleToggleMenu}
              data-testid="hyperliquid-dapp-bar-deposit-sheet__overflow"
            />
            {isMenuOpen ? (
              <div
                id={menuId}
                role="menu"
                className="absolute right-0 bottom-full z-[1] mb-1 min-w-[180px] rounded-lg border border-muted bg-default p-0 shadow-lg"
                data-testid="hyperliquid-dapp-bar-deposit-sheet__menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-12 w-full items-center px-4 py-2 text-left text-s-body-sm font-medium hover:bg-hover"
                  onClick={handleDisableClick}
                  data-testid="hyperliquid-dapp-bar-deposit-sheet__disable"
                >
                  {t('disableThisFeature')}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div
        className="hyperliquid-dapp-bar-deposit-sheet__row"
        data-testid="hyperliquid-dapp-bar-deposit-sheet__row"
      >
        <Box className="hyperliquid-dapp-bar-deposit-sheet__body">
          <PerpsMarketBalanceActions
            showActionButtons={!isInitialLoading}
            actionButtonSize={ButtonSize.Sm}
            actionsPlacement="beside"
            onAddFunds={triggerDeposit}
            onWithdraw={triggerWithdraw}
          />
        </Box>
      </div>

      {isConfirmOpen ? (
        <HidePerpsBalanceConfirmDialog onClose={handleCloseConfirm} />
      ) : null}
    </Box>
  );
});

HyperliquidDappBarDepositSheet.displayName = 'HyperliquidDappBarDepositSheet';
