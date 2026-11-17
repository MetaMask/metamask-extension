import React, { useId } from 'react';
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
import { MoneyInfoDialog } from './money-info-dialog';

export const MONEY_USD_DIALOG_TEST_ID = 'money-usd-dialog';

export type MoneyUsdDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  receiveAmountFormatted: string;
  apyPercentFormatted?: string;
};

/**
 * MetaMask USD (mUSD) info dialog opened from the deposit confirmation's
 * "You'll receive" amount underline.
 */
export function MoneyUsdDialog({
  isOpen,
  onClose,
  receiveAmountFormatted,
  apyPercentFormatted,
}: Readonly<MoneyUsdDialogProps>) {
  const t = useI18nContext();
  const titleId = useId();
  const apyDisplay = apyPercentFormatted ?? '—';

  return (
    <MoneyInfoDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      data-testid={MONEY_USD_DIALOG_TEST_ID}
    >
      <div className="flex flex-col gap-4">
        <Text
          variant={TextVariant.HeadingLg}
          color={TextColor.TextDefault}
          asChild
        >
          <h2 id={titleId} data-testid="money-usd-dialog-title">
            {t('moneyAccountDepositUsdDialogTitle', [receiveAmountFormatted])}
          </h2>
        </Text>

        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="money-usd-dialog-lead"
        >
          {t('moneyAccountDepositUsdDialogLead')}
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
                {t('moneyAccountDepositUsdDialogAlwaysWorthTitle')}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="mt-1"
              >
                {t('moneyAccountDepositUsdDialogAlwaysWorthBody')}
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
                {t('moneyAccountDepositUsdDialogBackedTitle')}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="mt-1"
              >
                {t('moneyAccountDepositUsdDialogBackedBody')}
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
                data-testid="money-usd-dialog-earns-title"
              >
                {t('moneyAccountDepositUsdDialogEarnsTitle', [
                  <span key="apy" className="text-success-default">
                    {t('moneyApy', [apyDisplay])}
                  </span>,
                ])}
              </Text>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="mt-1"
              >
                {t('moneyAccountDepositUsdDialogEarnsBody')}
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
      </div>
    </MoneyInfoDialog>
  );
}
