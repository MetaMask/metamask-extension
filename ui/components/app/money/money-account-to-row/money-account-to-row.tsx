import React, { useCallback, useState } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { RouteMessengerProvider } from '../../../../contexts/route-messenger';
import { openMoneyFtue } from '../../../../ducks/money-ftue';
import { MoneyFtueEntryPoint } from '../../../../helpers/money/money-ftue-entry-point';
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import { useMoneyVaultApy } from '../../../../hooks/money/useMoneyVaultApy';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../../../pages/money/constants/money-events';
import { useDispatch } from '../../../../store/hooks';
import { ConfirmInfoRow, ConfirmInfoRowSize } from '../../confirm/info/row/row';
import { MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES } from '../messenger';
import { DottedTrigger, MoneyApyDialog } from '../money-deposit-dialogs';

export type MoneyAccountToRowProps = {
  variant?: ConfirmInfoRowSize;
};

const MoneyAccountToRowContent = ({
  variant = ConfirmInfoRowSize.Small,
}: MoneyAccountToRowProps) => {
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
        source: 'depositInfo',
        origin: {
          entryPoint: MoneyFtueEntryPoint.MoneyDepositConfirmation,
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
};

export function MoneyAccountToRow(props: MoneyAccountToRowProps = {}) {
  return (
    <RouteMessengerProvider
      path="money-account-to-row"
      capabilities={MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES}
    >
      <MoneyAccountToRowContent {...props} />
    </RouteMessengerProvider>
  );
}
