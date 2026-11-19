import React, { useId } from 'react';
import { Text, TextColor, TextVariant } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { MoneyInfoDialog } from './money-info-dialog';

export const MONEY_APY_DIALOG_TEST_ID = 'money-apy-dialog';

const APY_SECTIONS = [
  {
    id: 'how-it-works',
    titleKey: 'moneyHowItWorks',
    bodyKey: 'moneyAccountDepositApyDialogHowItWorksBody',
  },
  {
    id: 'why-changes',
    titleKey: 'moneyAccountDepositApyDialogWhyChangesTitle',
    bodyKey: 'moneyAccountDepositApyDialogWhyChangesBody',
  },
  {
    id: 'where-it-comes-from',
    titleKey: 'moneyAccountDepositApyDialogWhereItComesFromTitle',
    bodyKey: 'moneyAccountDepositApyDialogWhereItComesFromBody',
  },
] as const;

export type MoneyApyDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  apyPercentFormatted: string;
};

/**
 * APY info dialog opened from the deposit confirmation's APY trigger.
 */
export function MoneyApyDialog({
  isOpen,
  onClose,
  apyPercentFormatted,
}: Readonly<MoneyApyDialogProps>) {
  const t = useI18nContext();
  const titleId = useId();

  return (
    <MoneyInfoDialog
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      data-testid={MONEY_APY_DIALOG_TEST_ID}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Text
            variant={TextVariant.HeadingLg}
            color={TextColor.SuccessDefault}
            asChild
          >
            <h2 id={titleId} data-testid="money-apy-dialog-title">
              {t('moneyApy', [apyPercentFormatted])}
            </h2>
          </Text>
          <Text
            variant={TextVariant.HeadingSm}
            color={TextColor.TextDefault}
            data-testid="money-apy-dialog-subtitle"
          >
            {t('moneyAccountDepositApyDialogSubtitle')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.TextAlternative}
            className="mt-1"
            data-testid="money-apy-dialog-lead"
          >
            {t('moneyAccountDepositApyDialogLead')}
          </Text>
        </div>

        {APY_SECTIONS.map(({ id, titleKey, bodyKey }) => (
          <div key={id} className="flex flex-col gap-1">
            <Text variant={TextVariant.HeadingSm} color={TextColor.TextDefault}>
              {t(titleKey)}
            </Text>
            <Text
              variant={TextVariant.BodySm}
              color={TextColor.TextAlternative}
            >
              {t(bodyKey)}
            </Text>
          </div>
        ))}
      </div>
    </MoneyInfoDialog>
  );
}
