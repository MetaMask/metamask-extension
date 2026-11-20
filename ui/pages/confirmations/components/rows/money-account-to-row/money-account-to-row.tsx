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
import { DottedTrigger } from '../../dotted-trigger';
import {
  PayChecklistDialog,
  PaySectionsDialog,
} from '../../modals/pay-info-dialogs';

export const MONEY_APY_DIALOG_TEST_ID = 'money-apy-dialog';
export const MONEY_INTRO_DIALOG_TEST_ID = 'money-intro-dialog';

const APY_SECTION_KEYS = [
  {
    bodyKey: 'moneyAccountDepositApyDialogHowItWorksBody',
    id: 'how-it-works',
    titleKey: 'moneyHowItWorks',
  },
  {
    bodyKey: 'moneyAccountDepositApyDialogWhyChangesBody',
    id: 'why-changes',
    titleKey: 'moneyAccountDepositApyDialogWhyChangesTitle',
  },
  {
    bodyKey: 'moneyAccountDepositApyDialogWhereItComesFromBody',
    id: 'where-it-comes-from',
    titleKey: 'moneyAccountDepositApyDialogWhereItComesFromTitle',
  },
] as const;

const INTRO_BENEFIT_KEYS = [
  {
    bodyKey: 'moneyFtueBenefitConvertDescription',
    id: 'convert',
    titleKey: 'moneyFtueBenefitConvertTitle',
  },
  {
    bodyKey: 'moneyFtueBenefitEarnDescription',
    id: 'earn',
    titleKey: 'moneyFtueBenefitEarnTitle',
  },
  {
    bodyKey: 'moneyFtueBenefitTradeDescription',
    id: 'trade',
    titleKey: 'moneyFtueBenefitTradeTitle',
  },
  {
    bodyKey: 'moneyFtueBenefitWithdrawDescription',
    id: 'withdraw',
    titleKey: 'moneyFtueBenefitWithdrawTitle',
  },
  {
    bodyKey: 'moneyFtueBenefitSpendDescription',
    id: 'spend',
    titleKey: 'moneyFtueBenefitSpendTitle',
  },
] as const;

const INTRO_HERO_IMAGES = {
  backgroundSrc: './images/money-ftue-hero-background-card.svg',
  foregroundSrc: './images/money-ftue-hero-coins.png',
} as const;

const MoneyIntroContentDialog = ({
  apyPercentFormatted,
  isOpen,
  onClose,
  onOpenApyDialog,
}: Readonly<{
  apyPercentFormatted?: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenApyDialog?: () => void;
}>) => {
  const t = useI18nContext();
  const apyDisplay = apyPercentFormatted ?? '—';

  const apyNode =
    apyPercentFormatted && onOpenApyDialog ? (
      <DottedTrigger
        key="apy"
        color={TextColor.SuccessDefault}
        data-testid="money-intro-dialog-apy-trigger"
        onClick={onOpenApyDialog}
        text={apyPercentFormatted}
        variant={TextVariant.BodyMd}
      />
    ) : (
      <span key="apy" className="text-success-default">
        {apyDisplay}
      </span>
    );

  const items = INTRO_BENEFIT_KEYS.map(({ bodyKey, id, titleKey }) => ({
    body: t(bodyKey),
    id,
    itemTestId: `money-intro-dialog-benefit-${id}`,
    title: t(titleKey),
  }));

  return (
    <PayChecklistDialog
      data-testid={MONEY_INTRO_DIALOG_TEST_ID}
      headerTitle={t('moneyFtueTitle')}
      headerTitleTestId="money-intro-dialog-title"
      heroImages={INTRO_HERO_IMAGES}
      isOpen={isOpen}
      items={items}
      lead={t('moneyFtueDescription', [apyNode])}
      leadTestId="money-intro-dialog-description"
      onClose={onClose}
      title={t('moneyFtueHeadline')}
      titleTestId="money-intro-dialog-headline"
    />
  );
};

export type MoneyAccountToRowProps = {
  variant?: ConfirmInfoRowSize;
};

/**
 * Destination row shown on Money Account deposits:
 * `To: [Money icon] MetaMask Money • 6.2% APY`.
 *
 * Activating `MetaMask Money` opens the read-only Money intro dialog, and
 * activating the APY opens the APY info dialog.
 */
export function MoneyAccountToRow({
  variant = ConfirmInfoRowSize.Small,
}: MoneyAccountToRowProps = {}) {
  const t = useI18nContext();
  const { apyPercentFormatted } = useMoneyVaultApy({ enabled: true });
  const { trackTooltipClicked } = useMoneyAnalytics({
    screenName: MoneyScreenName.MoneyDeposit,
  });
  const [isIntroDialogOpen, setIsIntroDialogOpen] = useState(false);
  const [isApyDialogOpen, setIsApyDialogOpen] = useState(false);

  const handleOpenMoneyIntro = useCallback(() => {
    setIsIntroDialogOpen(true);
  }, []);

  const handleCloseMoneyIntro = useCallback(() => {
    setIsIntroDialogOpen(false);
  }, []);

  const handleOpenApyDialog = useCallback(() => {
    trackTooltipClicked({
      tooltipName: MoneyTooltipName.Apy,
      tooltipType: MoneyTooltipType.Info,
    });
    setIsIntroDialogOpen(false);
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
                <span aria-hidden="true">•</span>
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
      <MoneyIntroContentDialog
        apyPercentFormatted={apyPercentFormatted}
        isOpen={isIntroDialogOpen}
        onClose={handleCloseMoneyIntro}
        onOpenApyDialog={apyPercentFormatted ? handleOpenApyDialog : undefined}
      />
      {apyPercentFormatted ? (
        <PaySectionsDialog
          data-testid={MONEY_APY_DIALOG_TEST_ID}
          isOpen={isApyDialogOpen}
          lead={t('moneyAccountDepositApyDialogLead')}
          onClose={handleCloseApyDialog}
          sections={APY_SECTION_KEYS.map(({ bodyKey, id, titleKey }) => ({
            body: t(bodyKey),
            id,
            title: t(titleKey),
          }))}
          subtitle={t('moneyAccountDepositApyDialogSubtitle')}
          title={t('moneyApy', [apyPercentFormatted])}
          titleColor={TextColor.SuccessDefault}
        />
      ) : null}
    </>
  );
}
