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
import { useI18nContext } from '../../../../../hooks/useI18nContext';
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

  const bullets: {
    id: string;
    title: React.ReactNode;
    body: string;
    titleTestId?: string;
  }[] = [
    {
      id: 'always-worth',
      title: t('moneyAccountDepositUsdDialogAlwaysWorthTitle'),
      body: t('moneyAccountDepositUsdDialogAlwaysWorthBody'),
    },
    {
      id: 'backed',
      title: t('moneyAccountDepositUsdDialogBackedTitle'),
      body: t('moneyAccountDepositUsdDialogBackedBody'),
    },
    {
      id: 'earns',
      titleTestId: 'money-usd-dialog-earns-title',
      title: t('moneyAccountDepositUsdDialogEarnsTitle', [
        <span key="apy" className="text-success-default">
          {t('moneyApy', [apyDisplay])}
        </span>,
      ]),
      body: t('moneyAccountDepositUsdDialogEarnsBody'),
    },
    {
      id: 'no-lockups',
      title: t('moneyAccountDepositNoLockupsTitle'),
      body: t('moneyAccountDepositNoLockupsBody'),
    },
  ];

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
          {bullets.map(({ id, title, body, titleTestId }) => (
            <li key={id} className="flex items-start gap-4">
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
                  data-testid={titleTestId}
                >
                  {title}
                </Text>
                <Text
                  variant={TextVariant.BodySm}
                  color={TextColor.TextAlternative}
                  className="mt-1"
                >
                  {body}
                </Text>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </MoneyInfoDialog>
  );
}
