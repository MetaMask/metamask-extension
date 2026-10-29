import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  IconName,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { TokenIcon } from '../../../components/app/token-icon';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import type { AccountsApiActivity } from '../types/money-activity';
import {
  getAccountsApiActivityDisplayInfo,
  type MoneyActivityTranslate,
} from '../utils/money-activity-display';
import {
  formatMoneyActivityDetailsDate,
  getMoneyActivityExplorerUrl,
  getMoneyApiActivityDetailsHeroAmount,
  shortenMoneyActivityHex,
} from '../utils/money-transaction-details-display';
import { MoneyTransactionDetailsRow } from './money-transaction-details-row';

const HERO_COPY_KEY: Record<AccountsApiActivity['kind'], string> = {
  card: 'moneyActivityDetailsYouSpent',
  cashback: 'moneyActivityDetailsYouEarned',
  refund: 'moneyActivityDetailsYouWereRefunded',
};

export type MoneyApiActivityDetailsProps = {
  activity: AccountsApiActivity;
  privacyMode?: boolean;
  onBack: () => void;
};

/**
 * Details body for Accounts API card, cashback, and refund activity.
 *
 * @param props - Component props.
 * @param props.activity - Parsed Accounts API settlement.
 * @param props.privacyMode - When true, hides the hero amount.
 * @param props.onBack - Back-navigation handler.
 * @returns The Accounts API activity details view.
 */
export function MoneyApiActivityDetails({
  activity,
  privacyMode = false,
  onBack,
}: MoneyApiActivityDetailsProps) {
  const t = useI18nContext() as MoneyActivityTranslate;
  // useCopyToClipboard analysis: Copies a public transaction hash
  const [, handleCopy] = useCopyToClipboard();

  const display = getAccountsApiActivityDisplayInfo(activity, t);
  const hero = getMoneyApiActivityDetailsHeroAmount(activity);
  const explorerUrl = getMoneyActivityExplorerUrl(
    activity.chainId,
    activity.hash,
  );
  const counterparty =
    activity.kind === 'card' ? activity.paidTo : activity.receivedFrom;
  const counterpartyLabel =
    activity.kind === 'card'
      ? t('moneyActivityDetailsPaidTo')
      : t('moneyActivityDetailsReceivedFrom');

  return (
    <main
      className="flex min-h-full flex-col bg-background-default"
      data-testid="money-api-activity-details"
    >
      <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-4">
        <ButtonIcon
          iconName={IconName.ArrowLeft}
          ariaLabel={t('back')}
          onClick={onBack}
          data-testid="money-api-activity-details-back-button"
        />
        <Text
          variant={TextVariant.HeadingSm}
          fontWeight={FontWeight.Medium}
          textAlign={TextAlign.Center}
          data-testid="money-api-activity-details-title"
        >
          {display.label}
        </Text>
        <div className="w-10" aria-hidden />
      </div>

      <Box
        flexDirection={BoxFlexDirection.Column}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={2}
        paddingBottom={6}
        gap={1}
      >
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextAlternative}
          data-testid="money-api-activity-details-hero-copy"
        >
          {t(HERO_COPY_KEY[activity.kind])}
        </Text>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          gap={3}
        >
          <TokenIcon
            chainId={activity.chainId}
            tokenAddress={activity.token.address}
            symbol={activity.token.symbol}
            size="xl"
          />
          <SensitiveText
            variant={TextVariant.DisplayMd}
            fontWeight={FontWeight.Medium}
            color={
              hero.isSuccessColor
                ? TextColor.SuccessDefault
                : TextColor.TextDefault
            }
            isHidden={privacyMode}
            length={SensitiveTextLength.Medium}
            data-testid="money-api-activity-details-hero-amount"
          >
            {hero.amount}
          </SensitiveText>
        </Box>
      </Box>

      <Box paddingLeft={4} paddingRight={4} className="flex-1">
        <MoneyTransactionDetailsRow
          label={
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('status')}
            </Text>
          }
          testId="money-api-activity-details-status"
          value={
            <Text
              variant={TextVariant.BodyMd}
              fontWeight={FontWeight.Medium}
              color={TextColor.SuccessDefault}
              data-testid="money-api-activity-details-status-value"
            >
              {t('completed')}
            </Text>
          }
        />
        <MoneyTransactionDetailsRow
          label={
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('date')}
            </Text>
          }
          testId="money-api-activity-details-date"
          value={formatMoneyActivityDetailsDate(activity.time)}
        />
        <MoneyTransactionDetailsRow
          label={
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {counterpartyLabel}
            </Text>
          }
          testId="money-api-activity-details-counterparty"
          value={shortenMoneyActivityHex(counterparty)}
        />
        <MoneyTransactionDetailsRow
          label={
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('moneyActivityDetailsTransactionId')}
            </Text>
          }
          testId="money-api-activity-details-hash"
          value={
            <Box
              flexDirection={BoxFlexDirection.Row}
              alignItems={BoxAlignItems.Center}
              justifyContent={BoxJustifyContent.End}
              gap={1}
            >
              <Text variant={TextVariant.BodyMd} fontWeight={FontWeight.Medium}>
                {shortenMoneyActivityHex(activity.hash)}
              </Text>
              <ButtonIcon
                iconName={IconName.Copy}
                ariaLabel={t('copyTransactionId')}
                onClick={() => handleCopy(activity.hash)}
                data-testid="money-api-activity-details-copy-hash"
              />
            </Box>
          }
        />
      </Box>

      {explorerUrl ? (
        <Box padding={4} className="mt-auto">
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            className="w-full"
            onClick={() => global.platform.openTab({ url: explorerUrl })}
            data-testid="money-api-activity-details-explorer"
          >
            {t('viewOnBlockExplorer')}
          </Button>
        </Box>
      ) : null}
    </main>
  );
}
