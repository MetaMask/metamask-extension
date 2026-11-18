import React, { useCallback, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
} from '../../../../../components/app/confirm/info/row/row';
import { openMoneyFtue } from '../../../../../ducks/money-ftue';
import { MoneyFtueEntryPoint } from '../../../../../helpers/money/money-ftue-entry-point';
import { useMoneyAnalytics } from '../../../../../hooks/money/useMoneyAnalytics';
import { useMoneyVaultApy } from '../../../../../hooks/money/useMoneyVaultApy';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

/* eslint-disable import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog */
import {
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../../../money/constants/money-events';
/* eslint-enable import-x/no-restricted-paths */
import { useDispatch } from '../../../../../store/hooks';
import {
  DottedTrigger,
  MoneyApyDialog,
} from '../../modals/money-deposit-dialogs';

export type MoneyAccountToRowProps = {
  variant?: ConfirmInfoRowSize;
};

/**
 * Destination row shown on Money Account deposits:
 * `To: [Money icon] MetaMask Money • 6.2% APY`.
 *
 * Activating `MetaMask Money` opens the existing Money intro splash, and
 * activating the APY opens the APY info dialog.
 */
export function MoneyAccountToRow({
  variant = ConfirmInfoRowSize.Small,
}: MoneyAccountToRowProps = {}) {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { apyPercentFormatted } = useMoneyVaultApy({ enabled: true });
  const { trackTooltipClicked } = useMoneyAnalytics({
    screenName: MoneyScreenName.MoneyDeposit,
  });
  const [isApyDialogOpen, setIsApyDialogOpen] = useState(false);

  const handleOpenMoneyIntro = useCallback(() => {
    dispatch(
      openMoneyFtue({
        source: 'deposit',
        origin: {
          entryPoint: MoneyFtueEntryPoint.Unknown,
        },
      }),
    );
  }, [dispatch]);

  const handleOpenApyDialog = useCallback(() => {
    trackTooltipClicked({
      tooltipName: MoneyTooltipName.Apy,
      tooltipType: MoneyTooltipType.Info,
    });
    setIsApyDialogOpen(true);
  }, [trackTooltipClicked]);

  const handleCloseApyDialog = useCallback(() => {
    setIsApyDialogOpen(false);
  }, []);

  return (
    <>
      <ConfirmInfoRow
        data-testid="money-account-to-row"
        label={t('to')}
        rowVariant={variant}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={1}
        >
          <img
            src="./images/money.png"
            alt=""
            width={24}
            height={24}
            className="shrink-0"
            data-testid="money-account-to-icon"
          />
          <DottedTrigger
            text={t('moneyFtueTitle')}
            variant={TextVariant.BodyMd}
            color={TextColor.TextDefault}
            onClick={handleOpenMoneyIntro}
            data-testid="money-account-to-splash-trigger"
          />
          {apyPercentFormatted ? (
            <>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                asChild
              >
                <span>•</span>
              </Text>
              <DottedTrigger
                text={t('moneyApy', [apyPercentFormatted])}
                variant={TextVariant.BodyMd}
                color={TextColor.SuccessDefault}
                onClick={handleOpenApyDialog}
                data-testid="money-account-to-apy-trigger"
              />
            </>
          ) : null}
        </Box>
      </ConfirmInfoRow>
      {apyPercentFormatted ? (
        <MoneyApyDialog
          isOpen={isApyDialogOpen}
          onClose={handleCloseApyDialog}
          apyPercentFormatted={apyPercentFormatted}
        />
      ) : null}
    </>
  );
}
