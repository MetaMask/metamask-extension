import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonIcon,
  ButtonSize,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  SensitiveText,
  SensitiveTextLength,
  Skeleton,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  DEFAULT_ROUTE,
  MONEY_ACTIVITY_ROUTE,
  PREVIOUS_ROUTE,
} from '../../helpers/constants/routes';
import { moneyFormatUsd } from '../../helpers/money/format';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyActivityItems } from '../../hooks/money/use-money-activity-items';
import { selectMoneyActivityDetailsEnabled } from '../../selectors/money/money-account-feature-flags';
import { getPrivacyMode } from '../../selectors/selectors';
import { getInternalAccountByAddress } from '../../selectors/accounts';
import {
  selectTransactionById,
  type TransactionState,
} from '../../selectors/transactionController';
import { onchainItem } from './types/money-activity';
import {
  getMoneyActivityDisplayInfo,
  type MoneyActivityTranslate,
} from './utils/money-activity-display';
import {
  formatMoneyActivityDetailsDate,
  getMoneyActivityErrorMessage,
  getMoneyActivityExplorerUrl,
  getMoneyActivityPaidWith,
  getMoneyTransactionDetailsHeroAmount,
  shortenMoneyActivityHex,
} from './utils/money-transaction-details-display';
import { getMoneyActivityStatus } from './utils/classify-money-activity';
import { isVisibleMoneyActivityTransaction } from './utils/money-account-transactions';
import { resetOverflowAncestorScroll } from './utils/reset-overflow-ancestor-scroll';
import { MoneyTransactionDetailsRow } from './components/money-transaction-details-row';
import { MoneyTransactionDetailsError } from './components/money-transaction-details-error';

const USDC_TOKEN_IMAGE = './images/icon-usdc.png';
const ZERO_USD = moneyFormatUsd(new BigNumber(0));

const STATUS_I18N_KEY = {
  confirmed: 'confirmed',
  pending: 'pending',
  failed: 'failed',
} as const;

const STATUS_COLOR = {
  confirmed: TextColor.SuccessDefault,
  pending: TextColor.WarningDefault,
  failed: TextColor.ErrorDefault,
} as const;

export function MoneyTransactionDetailsPage() {
  const t = useI18nContext() as MoneyActivityTranslate;
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const privacyMode = useSelector(getPrivacyMode);
  const detailsEnabled = useSelector(selectMoneyActivityDetailsEnabled);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const { items } = useMoneyActivityItems();
  const controllerTx = useSelector((state: TransactionState) =>
    selectTransactionById(state, transactionId),
  );
  const pageRef = useRef<HTMLDivElement>(null);
  // useCopyToClipboard analysis: Copies a public transaction hash
  const [, handleCopy] = useCopyToClipboard();

  useLayoutEffect(() => {
    resetOverflowAncestorScroll(pageRef.current);
  }, [transactionId]);

  const item = useMemo(() => {
    const listItem = items.find(
      (candidate) =>
        candidate.kind === 'onchain' && candidate.id === transactionId,
    );
    if (listItem) {
      return listItem;
    }
    if (!controllerTx) {
      return undefined;
    }
    const moneyAddress = availability.isAvailable
      ? availability.address
      : undefined;
    return isVisibleMoneyActivityTransaction(controllerTx, moneyAddress)
      ? onchainItem(controllerTx)
      : undefined;
  }, [availability, controllerTx, items, transactionId]);
  const fromAddress =
    item?.kind === 'onchain' ? item.tx.txParams.from : undefined;
  const fromAccount = useSelector((state) =>
    fromAddress ? getInternalAccountByAddress(state, fromAddress) : undefined,
  );

  const explorerUrl =
    item?.kind === 'onchain'
      ? getMoneyActivityExplorerUrl(item.tx.chainId, item.tx.hash)
      : undefined;

  const handleBack = useCallback(() => {
    navigate(PREVIOUS_ROUTE);
  }, [navigate]);

  let body: React.ReactNode;
  if (isAvailabilityLoading) {
    body = (
      <div
        className="flex min-h-full flex-col gap-4 bg-background-default p-4"
        data-testid="money-transaction-details-loading"
      >
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  } else if (!availability.isAvailable) {
    body = <Navigate to={DEFAULT_ROUTE} replace />;
  } else if (!detailsEnabled || !item || item.kind !== 'onchain') {
    body = <Navigate to={MONEY_ACTIVITY_ROUTE} replace />;
  } else {
    const { tx } = item;
    const display = getMoneyActivityDisplayInfo(tx, t);
    const hero = getMoneyTransactionDetailsHeroAmount(tx);
    const status = getMoneyActivityStatus(tx);
    const errorMessage = getMoneyActivityErrorMessage(tx);
    const paidWith = getMoneyActivityPaidWith(tx);
    let accountLabel = fromAddress
      ? shortenMoneyActivityHex(fromAddress)
      : undefined;
    if (accountLabel && fromAccount) {
      accountLabel = `${fromAccount.metadata.name} (${accountLabel})`;
    }
    const transactionHash = tx.hash;

    body = (
      <main
        className="flex min-h-full flex-col bg-background-default"
        data-testid="money-transaction-details-page"
      >
        <div className="grid grid-cols-[auto_1fr_auto] items-center px-4 py-4">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            onClick={handleBack}
            data-testid="money-transaction-details-back-button"
          />
          <Text
            variant={TextVariant.HeadingSm}
            fontWeight={FontWeight.Medium}
            textAlign={TextAlign.Center}
            data-testid="money-transaction-details-title"
          >
            {display.label}
          </Text>
          <div className="w-10" aria-hidden />
        </div>

        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          paddingLeft={4}
          paddingRight={4}
          paddingTop={2}
          paddingBottom={6}
          gap={3}
        >
          <AvatarToken
            name="USDC"
            src={USDC_TOKEN_IMAGE}
            size={AvatarTokenSize.Xl}
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
            data-testid="money-transaction-details-hero-amount"
          >
            {hero.amount}
          </SensitiveText>
        </Box>

        <Box paddingLeft={4} paddingRight={4} className="flex-1">
          <MoneyTransactionDetailsRow
            label={t('status')}
            testId="money-transaction-details-status"
            value={
              <Box
                flexDirection={BoxFlexDirection.Column}
                alignItems={BoxAlignItems.End}
                className="min-w-0"
              >
                <Text
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  color={STATUS_COLOR[status]}
                  data-testid="money-transaction-details-status-value"
                >
                  {t(STATUS_I18N_KEY[status])}
                </Text>
                {status === 'failed' && errorMessage ? (
                  <MoneyTransactionDetailsError message={errorMessage} />
                ) : null}
              </Box>
            }
          />
          <MoneyTransactionDetailsRow
            label={t('date')}
            testId="money-transaction-details-date"
            value={formatMoneyActivityDetailsDate(item.time)}
          />
          <MoneyTransactionDetailsRow
            label={t('paidWith')}
            testId="money-transaction-details-paid-with"
            value={paidWith}
          />
          <MoneyTransactionDetailsRow
            label={t('account')}
            testId="money-transaction-details-account"
            value={accountLabel}
          />
          {transactionHash ? (
            <MoneyTransactionDetailsRow
              label={t('moneyActivityDetailsTransactionId')}
              testId="money-transaction-details-hash"
              value={
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  justifyContent={BoxJustifyContent.End}
                  gap={1}
                >
                  <Text
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                  >
                    {shortenMoneyActivityHex(transactionHash)}
                  </Text>
                  <ButtonIcon
                    iconName={IconName.Copy}
                    ariaLabel={t('copyTransactionId')}
                    onClick={() => handleCopy(transactionHash)}
                    data-testid="money-transaction-details-copy-hash"
                  />
                </Box>
              }
            />
          ) : null}

          <div className="my-3 h-px w-full bg-border-muted" />

          <MoneyTransactionDetailsRow
            label={t('transactionFee')}
            labelEnd={
              <Icon
                name={IconName.Info}
                size={IconSize.Sm}
                color={IconColor.IconAlternative}
                aria-hidden
              />
            }
            testId="money-transaction-details-fee"
            value={
              <SensitiveText
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {ZERO_USD}
              </SensitiveText>
            }
          />
          <MoneyTransactionDetailsRow
            label={t('total')}
            testId="money-transaction-details-total"
            value={
              <SensitiveText
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {ZERO_USD}
              </SensitiveText>
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
              data-testid="money-transaction-details-explorer"
            >
              {t('viewOnBlockExplorer')}
            </Button>
          </Box>
        ) : null}
      </main>
    );
  }

  return (
    <div ref={pageRef} className="contents">
      {body}
    </div>
  );
}

export default MoneyTransactionDetailsPage;
