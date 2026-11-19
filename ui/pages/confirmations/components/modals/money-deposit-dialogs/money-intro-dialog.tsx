import React from 'react';
import {
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { DottedTrigger } from './dotted-trigger';
import { MoneyCheckList } from './money-check-list';
import { MoneyInfoDialog } from './money-info-dialog';

export const MONEY_INTRO_DIALOG_TEST_ID = 'money-intro-dialog';

const INTRO_BENEFIT_KEYS = [
  [
    'convert',
    'moneyFtueBenefitConvertTitle',
    'moneyFtueBenefitConvertDescription',
  ],
  ['earn', 'moneyFtueBenefitEarnTitle', 'moneyFtueBenefitEarnDescription'],
  ['trade', 'moneyFtueBenefitTradeTitle', 'moneyFtueBenefitTradeDescription'],
  [
    'withdraw',
    'moneyFtueBenefitWithdrawTitle',
    'moneyFtueBenefitWithdrawDescription',
  ],
  ['spend', 'moneyFtueBenefitSpendTitle', 'moneyFtueBenefitSpendDescription'],
] as const;

export type MoneyIntroDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  apyPercentFormatted?: string;
  onOpenApyDialog?: () => void;
};

/**
 * Read-only MetaMask Money overview dialog opened from the deposit
 * confirmation's `To: MetaMask Money` trigger. Closing it returns directly to
 * the in-progress confirmation without re-initiating or canceling the deposit.
 */
export function MoneyIntroDialog({
  isOpen,
  onClose,
  apyPercentFormatted,
  onOpenApyDialog,
}: Readonly<MoneyIntroDialogProps>) {
  const t = useI18nContext();
  const apyDisplay = apyPercentFormatted ?? '—';

  const apyNode =
    apyPercentFormatted && onOpenApyDialog ? (
      <DottedTrigger
        key="apy"
        text={apyPercentFormatted}
        variant={TextVariant.BodyMd}
        color={TextColor.SuccessDefault}
        onClick={onOpenApyDialog}
        data-testid="money-intro-dialog-apy-trigger"
      />
    ) : (
      <span key="apy" className="text-success-default">
        {apyDisplay}
      </span>
    );

  const items = INTRO_BENEFIT_KEYS.map(([id, titleKey, bodyKey]) => ({
    id,
    title: t(titleKey),
    body: t(bodyKey),
    itemTestId: `money-intro-dialog-benefit-${id}`,
  }));

  return (
    <MoneyInfoDialog
      isOpen={isOpen}
      onClose={onClose}
      data-testid={MONEY_INTRO_DIALOG_TEST_ID}
      headerTitle={
        <Text
          variant={TextVariant.HeadingSm}
          fontWeight={FontWeight.Medium}
          asChild
        >
          <h2 className="pl-2" data-testid="money-intro-dialog-title">
            {t('moneyFtueTitle')}
          </h2>
        </Text>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="relative aspect-[16/9] w-full">
          <img
            src="./images/money-ftue-hero-background-card.svg"
            alt=""
            className="absolute inset-0 h-full w-full"
          />
          <img
            src="./images/money-ftue-hero-coins.png"
            alt=""
            className="absolute left-1/2 top-1/2 w-[59%] -translate-x-1/2 -translate-y-1/2"
          />
        </div>

        <div className="flex flex-col gap-3">
          <Text
            variant={TextVariant.HeadingLg}
            color={TextColor.TextDefault}
            data-testid="money-intro-dialog-headline"
          >
            {t('moneyFtueHeadline')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            data-testid="money-intro-dialog-description"
          >
            {t('moneyFtueDescription', [apyNode])}
          </Text>
        </div>

        <MoneyCheckList items={items} className="flex flex-col gap-4" />
      </div>
    </MoneyInfoDialog>
  );
}
