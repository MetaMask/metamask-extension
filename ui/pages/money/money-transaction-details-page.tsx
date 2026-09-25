import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import { PopoverPosition } from '../../components/component-library';
import { TooltipText } from '../../components/app/money/tooltip-text';
import { MONEY_ACCOUNT_FIAT_CURRENCY } from '../../../shared/lib/money/constants';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { useFormatters } from '../../hooks/useFormatters';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyActivityItems } from '../../hooks/money/use-money-activity-items';
import { useMoneyTransactionFee } from '../../hooks/money/use-money-transaction-fee';
import { selectMoneyActivityDetailsEnabled } from '../../selectors/money/money-account-feature-flags';
import { getPrivacyMode } from '../../selectors/selectors';
import { getInternalAccountByAddress } from '../../selectors/accounts';
import {
  selectTransactionById,
  type TransactionState,
} from '../../selectors/transactionController';
import { TokenIcon } from '../../components/app/token-icon';
import { isAccountsApiActivityId, onchainItem } from './types/money-activity';
import {
  getMoneyActivityDisplayInfo,
  type MoneyActivityTranslate,
} from './utils/money-activity-display';
import {
  formatMoneyActivityDetailsDate,
  getMoneyActivityAsset,
  getMoneyActivityErrorMessage,
  getMoneyActivityExplorerUrl,
  getMoneyActivityPaidWith,
  getMoneyTransactionDetailsHeroAmount,
  shortenMoneyActivityHex,
} from './utils/money-transaction-details-display';
import { getMoneyActivityStatus } from './utils/classify-money-activity';
import { isVisibleMoneyActivityTransaction } from './utils/money-account-transactions';
import { resetOverflowAncestorScroll } from './utils/reset-overflow-ancestor-scroll';
import { MoneyApiActivityDetails } from './components/money-api-activity-details';
import { MoneyTransactionDetailsRow } from './components/money-transaction-details-row';
import { MoneyTransactionDetailsError } from './components/money-transaction-details-error';

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
  const { formatCurrencyWithMinThreshold } = useFormatters();
  const navigate = useNavigate();
  const { transactionId } = useParams<{ transactionId: string }>();
  const privacyMode = useSelector(getPrivacyMode);
  const detailsEnabled = useSelector(selectMoneyActivityDetailsEnabled);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const { items, isSettling, hasMore, loadMore, isLoadingMore } =
    useMoneyActivityItems();
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
    const listItem = items.find((candidate) => candidate.id === transactionId);
    if (listItem) {
      return listItem;
    }
    // Accounts API ids never exist on TransactionController; skip the
    // on-chain fallback so a missing API row can keep paging instead.
    if (!controllerTx || isAccountsApiActivityId(transactionId)) {
      return undefined;
    }
    const moneyAddress = availability.isAvailable
      ? availability.address
      : undefined;
    return isVisibleMoneyActivityTransaction(controllerTx, moneyAddress)
      ? onchainItem(controllerTx)
      : undefined;
  }, [availability, controllerTx, items, transactionId]);

  const isLookingUpApiItem =
    isAccountsApiActivityId(transactionId) && item === undefined;

  useEffect(() => {
    if (isLookingUpApiItem && hasMore && !isLoadingMore && !isSettling) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, isLookingUpApiItem, isSettling, loadMore]);

  const isResolvingItem =
    item === undefined &&
    (isSettling || isLoadingMore || (isLookingUpApiItem && hasMore));

  const fromAddress =
    item?.kind === 'onchain' ? item.tx.txParams.from : undefined;
  const onchainTx = item?.kind === 'onchain' ? item.tx : undefined;
  const { feeUsd, totalUsd, isNetworkFeePaidByMetaMask } =
    useMoneyTransactionFee(onchainTx);
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
  const formattedFee =
    feeUsd === undefined
      ? '-'
      : formatCurrencyWithMinThreshold(feeUsd, MONEY_ACCOUNT_FIAT_CURRENCY);
  const formattedTotal =
    totalUsd === undefined
      ? '-'
      : formatCurrencyWithMinThreshold(totalUsd, MONEY_ACCOUNT_FIAT_CURRENCY);
  const isFullySponsoredFee =
    isNetworkFeePaidByMetaMask && feeUsd !== undefined && feeUsd === 0;
  // `networkFeeFiat` is Pay source-network gas. Cross-chain deposits keep that
  // user-paid; only claim sponsorship in the tooltip when it is absent/zero.
  const recordedSourceNetworkFee = onchainTx?.metamaskPay?.networkFeeFiat;
  const hasUserPaidSourceNetworkFee = Boolean(
    recordedSourceNetworkFee !== undefined &&
    recordedSourceNetworkFee.trim() !== '' &&
    Number(recordedSourceNetworkFee) > 0,
  );
  const showSponsoredNetworkFeeInTooltip =
    isNetworkFeePaidByMetaMask &&
    !hasUserPaidSourceNetworkFee &&
    feeUsd !== undefined &&
    feeUsd > 0;

  let body: React.ReactNode;
  if (isAvailabilityLoading || isResolvingItem) {
    body = (
      <div
        className="flex min-h-full flex-col gap-4 p-4"
        data-testid="money-transaction-details-loading"
      >
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  } else if (!availability.isAvailable) {
    body = <Navigate to={DEFAULT_ROUTE} replace />;
  } else if (!detailsEnabled || !item) {
    body = <Navigate to={MONEY_ACTIVITY_ROUTE} replace />;
  } else if (item.kind === 'accountsApi') {
    body = (
      <MoneyApiActivityDetails
        activity={item.tx}
        privacyMode={privacyMode}
        onBack={handleBack}
      />
    );
  } else {
    const { tx } = item;
    const display = getMoneyActivityDisplayInfo(tx, t);
    const hero = getMoneyTransactionDetailsHeroAmount(tx);
    const asset = getMoneyActivityAsset(tx);
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
      <div
        className="flex min-h-full flex-col"
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
          <TokenIcon
            chainId={asset.chainId}
            tokenAddress={asset.tokenAddress}
            symbol={asset.symbol}
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
            data-testid="money-transaction-details-hero-amount"
          >
            {hero.amount}
          </SensitiveText>
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
            label={
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('date')}
              </Text>
            }
            testId="money-transaction-details-date"
            value={formatMoneyActivityDetailsDate(item.time)}
          />
          <MoneyTransactionDetailsRow
            label={
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('paidWith')}
              </Text>
            }
            testId="money-transaction-details-paid-with"
            value={paidWith}
          />
          <MoneyTransactionDetailsRow
            label={
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('account')}
              </Text>
            }
            testId="money-transaction-details-account"
            value={accountLabel}
          />
          {transactionHash ? (
            <MoneyTransactionDetailsRow
              label={
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {t('moneyActivityDetailsTransactionId')}
                </Text>
              }
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
            label={
              <TooltipText
                text={t('transactionFee')}
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                position={PopoverPosition.BottomStart}
                data-testid="money-transaction-details-fee-info"
              >
                <Text variant={TextVariant.BodyMd}>
                  {t('moneyActivityTransactionFeeTooltip')}
                  {showSponsoredNetworkFeeInTooltip ? (
                    <>
                      <br />
                      {`${t('networkFee')}: ${t('paidByMetaMask')}`}
                    </>
                  ) : null}
                </Text>
              </TooltipText>
            }
            testId="money-transaction-details-fee"
            value={
              isFullySponsoredFee ? (
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={1}
                  data-testid="money-transaction-details-fee-sponsored"
                >
                  <Icon
                    name={IconName.Check}
                    size={IconSize.Sm}
                    color={IconColor.SuccessDefault}
                  />
                  <Text
                    variant={TextVariant.BodyMd}
                    color={TextColor.SuccessDefault}
                  >
                    {t('paidByMetaMask')}
                  </Text>
                </Box>
              ) : (
                <SensitiveText
                  variant={TextVariant.BodyMd}
                  fontWeight={FontWeight.Medium}
                  isHidden={privacyMode}
                  length={SensitiveTextLength.Short}
                >
                  {formattedFee}
                </SensitiveText>
              )
            }
          />
          <MoneyTransactionDetailsRow
            label={
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
              >
                {t('total')}
              </Text>
            }
            testId="money-transaction-details-total"
            value={
              <SensitiveText
                variant={TextVariant.BodyMd}
                fontWeight={FontWeight.Medium}
                isHidden={privacyMode}
                length={SensitiveTextLength.Short}
              >
                {formattedTotal}
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
      </div>
    );
  }

  return (
    <div ref={pageRef} className="contents">
      {body}
    </div>
  );
}

export default MoneyTransactionDetailsPage;
