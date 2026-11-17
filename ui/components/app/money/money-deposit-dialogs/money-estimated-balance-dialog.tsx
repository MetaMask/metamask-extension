import React, { useId } from 'react';
import BigNumber from 'bignumber.js';
import {
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { DUST_THRESHOLD } from '../../../../helpers/money/format';
import { MoneyInfoDialog } from './money-info-dialog';

export const MONEY_ESTIMATED_BALANCE_DIALOG_TEST_ID =
  'money-estimated-balance-dialog';

/**
 * Formats a dollar amount for dialog headlines, omitting `.00` for whole
 * dollar amounts while preserving cents when non-zero (e.g. `$100` vs
 * `$106.20`).
 *
 * @param value - Dollar value to format.
 * @returns Compact USD string.
 */
export function formatCompactUsd(value: BigNumber): string {
  if (value.isNaN() || !value.isFinite()) {
    return '';
  }

  const effective = value.abs().lt(DUST_THRESHOLD) ? new BigNumber(0) : value;
  const rounded = effective.round(2, BigNumber.ROUND_HALF_UP);
  const isWhole = rounded.eq(rounded.round(0, BigNumber.ROUND_DOWN));

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rounded.toNumber());
}

export type MoneyEstimatedBalanceDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  depositAmount: BigNumber;
  projectedBalanceFormatted: string;
  apyPercentFormatted: string;
};

/**
 * Estimated 1-year balance dialog opened from the deposit confirmation's
 * projected balance underline.
 */
export function MoneyEstimatedBalanceDialog({
  isOpen,
  onClose,
  depositAmount,
  projectedBalanceFormatted,
  apyPercentFormatted,
}: Readonly<MoneyEstimatedBalanceDialogProps>) {
  const t = useI18nContext();
  const titleId = useId();
  const depositFormatted = formatCompactUsd(depositAmount);

  return (
    <MoneyInfoDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      data-testid={MONEY_ESTIMATED_BALANCE_DIALOG_TEST_ID}
    >
      <div className="flex flex-col gap-4">
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          asChild
        >
          <h2 id={titleId} data-testid="money-estimated-balance-dialog-title">
            {t('moneyAccountDepositEstBalanceDialogTitle', [
              depositFormatted,
              projectedBalanceFormatted,
            ])}
          </h2>
        </Text>

        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="money-estimated-balance-dialog-subtitle"
        >
          {t('moneyAccountDepositEstBalanceDialogSubtitle', [
            <span key="apy" className="text-success-default">
              {t('moneyAccountDepositEstBalanceDialogSubtitleApy', [
                apyPercentFormatted,
              ])}
            </span>,
          ])}
        </Text>

        <ul className="mt-1 flex flex-col gap-4">
          <li className="flex items-start gap-4">
            <Icon
              name={IconName.Check}
              size={IconSize.Lg}
              color={IconColor.SuccessDefault}
              className="mt-0.5 shrink-0"
            />
            <div>
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
              >
                {t('moneyAccountDepositEstBalanceDialogCompoundTitle')}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="mt-1"
              >
                {t('moneyAccountDepositEstBalanceDialogCompoundBody')}
              </Text>
            </div>
          </li>

          <li className="flex items-start gap-4">
            <Icon
              name={IconName.Check}
              size={IconSize.Lg}
              color={IconColor.SuccessDefault}
              className="mt-0.5 shrink-0"
            />
            <div>
              <Text
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                color={TextColor.TextDefault}
              >
                {t('moneyAccountDepositNoLockupsTitle')}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="mt-1"
              >
                {t('moneyAccountDepositNoLockupsBody')}
              </Text>
            </div>
          </li>
        </ul>

        <Text
          variant={TextVariant.BodyXs}
          color={TextColor.TextAlternative}
          className="mt-1"
          data-testid="money-estimated-balance-dialog-disclaimer"
        >
          {t('moneyAccountDepositEstBalanceDialogDisclaimer', [
            apyPercentFormatted,
          ])}
        </Text>
      </div>
    </MoneyInfoDialog>
  );
}
