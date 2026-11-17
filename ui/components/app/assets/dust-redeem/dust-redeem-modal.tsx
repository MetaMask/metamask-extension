import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import {
  AvatarToken,
  AvatarTokenSize,
  BadgeNetwork,
  BadgeWrapper,
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Button,
  ButtonSize,
  ButtonVariant,
  Checkbox,
  FontWeight,
  Icon,
  IconName,
  IconSize,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SensitiveText,
  SensitiveTextLength,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  getCurrencyRateControllerCurrencyRates,
  getCurrencyRateControllerCurrentCurrency,
} from '../../../../../shared/lib/selectors/assets-migration';
import { getNetworkConfigurationsByChainId } from '../../../../../shared/lib/selectors/networks';
import { getImageForChainId } from '../../../../selectors/multichain';
import { useFormatters } from '../../../../hooks/useFormatters';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import type { TokenWithFiatAmount } from '../types';
import { getDustRedeemAmountText } from './dust-redeem-label';
import {
  DUST_BALANCE_THRESHOLDS_USD,
  type DustBalanceThresholdUsd,
  filterDustTokens,
  isDustBalanceThreshold,
} from './filter-dust-tokens';
import { getDustTokenKey, sumDustFiatAmount } from './sum-dust-fiat';

export const DUST_REDEEM_MODAL_TEST_ID = 'dust-redeem-modal';
export const DUST_REDEEM_CONFIRM_TEST_ID = 'dust-redeem-confirm';
export const DUST_REDEEM_SELECT_ALL_TEST_ID = 'dust-redeem-select-all';
export const DUST_REDEEM_BALANCE_FILTER_TEST_ID = 'dust-redeem-balance-filter';
export const DUST_REDEEM_INCLUDE_GAS_TEST_ID = 'dust-redeem-include-gas-tokens';

type DustRedeemModalProps = {
  isOpen: boolean;
  tokens: TokenWithFiatAmount[];
  privacyMode: boolean;
  onClose: () => void;
};

const getInitialSelection = (tokens: TokenWithFiatAmount[]) =>
  new Set(tokens.map(getDustTokenKey));

const getVisibleDustTokens = (
  tokens: TokenWithFiatAmount[],
  thresholdUsd: DustBalanceThresholdUsd,
  includeGasTokens: boolean,
  currencyRates: Parameters<typeof filterDustTokens>[1]['currencyRates'],
) =>
  filterDustTokens(tokens, {
    thresholdUsd,
    includeGasTokens,
    currencyRates,
  });

/**
 * Lets the user choose which low balance tokens to redeem for mUSD.
 * Confirming closes the modal and does not submit a redemption.
 *
 * @param props - The component props.
 * @param props.isOpen - Whether the modal is open.
 * @param props.tokens - Account tokens. The balance dropdown filters these.
 * @param props.privacyMode - Whether fiat balances are hidden.
 * @param props.onClose - Closes the modal.
 */
export const DustRedeemModal = ({
  isOpen,
  tokens,
  privacyMode,
  onClose,
}: DustRedeemModalProps) => {
  const t = useI18nContext();
  const currentCurrency = useSelector(getCurrencyRateControllerCurrentCurrency);
  const currencyRates = useSelector(getCurrencyRateControllerCurrencyRates);
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );
  const { formatCurrencyWithMinThreshold, formatTokenQuantity } =
    useFormatters();
  const [thresholdUsd, setThresholdUsd] = useState<DustBalanceThresholdUsd>(1);
  const [includeGasTokens, setIncludeGasTokens] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set<string>());
  const [wasOpen, setWasOpen] = useState(false);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setThresholdUsd(1);
      setIncludeGasTokens(false);
      setSelectedKeys(
        getInitialSelection(
          getVisibleDustTokens(tokens, 1, false, currencyRates),
        ),
      );
    }
  }

  const currency = currentCurrency || 'usd';
  const visibleTokens = getVisibleDustTokens(
    tokens,
    thresholdUsd,
    includeGasTokens,
    currencyRates,
  );
  const selectedTokens = visibleTokens.filter((token) =>
    selectedKeys.has(getDustTokenKey(token)),
  );
  const formattedSelectedAmount = formatCurrencyWithMinThreshold(
    sumDustFiatAmount(selectedTokens),
    currency,
  );
  const confirmLabel = t('dustRedeemForMusd', [
    getDustRedeemAmountText(formattedSelectedAmount, privacyMode),
  ]);
  const allSelected =
    visibleTokens.length > 0 &&
    visibleTokens.every((token) => selectedKeys.has(getDustTokenKey(token)));

  const handleThresholdChange = useCallback(
    (nextThreshold: DustBalanceThresholdUsd) => {
      setThresholdUsd(nextThreshold);
      setSelectedKeys(
        getInitialSelection(
          getVisibleDustTokens(
            tokens,
            nextThreshold,
            includeGasTokens,
            currencyRates,
          ),
        ),
      );
    },
    [currencyRates, includeGasTokens, tokens],
  );

  const handleIncludeGasTokens = useCallback(
    (includeGas: boolean) => {
      setIncludeGasTokens(includeGas);
      setSelectedKeys(
        getInitialSelection(
          getVisibleDustTokens(tokens, thresholdUsd, includeGas, currencyRates),
        ),
      );
    },
    [currencyRates, thresholdUsd, tokens],
  );

  const handleSelectAll = useCallback(
    (isSelected: boolean) => {
      setSelectedKeys(
        isSelected ? getInitialSelection(visibleTokens) : new Set(),
      );
    },
    [visibleTokens],
  );

  const handleTokenChange = useCallback((key: string, isSelected: boolean) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (isSelected) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const handleRedeem = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      data-testid={DUST_REDEEM_MODAL_TEST_ID}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={onClose}
          closeButtonProps={{ ariaLabel: t('close') }}
        >
          {t('dustRedeemTitle')}
        </ModalHeader>
        <ModalBody>
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('dustRedeemFromAccount')}
          </Text>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative inline-flex">
              <select
                aria-label={t('dustRedeemShowBalances')}
                data-testid={DUST_REDEEM_BALANCE_FILTER_TEST_ID}
                value={thresholdUsd}
                onChange={(event) => {
                  const nextThreshold = Number(event.target.value);
                  if (isDustBalanceThreshold(nextThreshold)) {
                    handleThresholdChange(nextThreshold);
                  }
                }}
                className="h-8 cursor-pointer appearance-none rounded-full bg-muted pl-4 pr-8 text-s-body-sm leading-s-body-sm font-medium tracking-s-body-sm text-default hover:bg-muted-hover active:bg-muted-pressed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-default focus-visible:ring-0 md:text-l-body-sm md:leading-l-body-sm md:tracking-l-body-sm"
              >
                {DUST_BALANCE_THRESHOLDS_USD.map((amount) => (
                  <option key={amount} value={amount}>
                    {t('dustRedeemBalanceUnder', [String(amount)])}
                  </option>
                ))}
              </select>
              <Icon
                name={IconName.ArrowDown}
                size={IconSize.Sm}
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"
              />
            </div>
            <Button
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              onClick={() => handleIncludeGasTokens(!includeGasTokens)}
              aria-pressed={includeGasTokens}
              data-testid={DUST_REDEEM_INCLUDE_GAS_TEST_ID}
            >
              {includeGasTokens
                ? t('dustRedeemExcludeGasTokens')
                : t('dustRedeemIncludeGasTokens')}
            </Button>
          </div>
          <Box marginTop={4}>
            <Checkbox
              id="dust-redeem-select-all"
              isSelected={allSelected}
              onChange={() => handleSelectAll(!allSelected)}
              label={t('selectAll')}
              inputProps={{ 'data-testid': DUST_REDEEM_SELECT_ALL_TEST_ID }}
            />
          </Box>
          {visibleTokens.map((token) => {
            const key = getDustTokenKey(token);
            const fiatLabel =
              typeof token.tokenFiatAmount === 'number'
                ? formatCurrencyWithMinThreshold(
                    token.tokenFiatAmount,
                    currency,
                  )
                : undefined;

            return (
              <Box
                key={key}
                flexDirection={BoxFlexDirection.Row}
                alignItems={BoxAlignItems.Center}
                justifyContent={BoxJustifyContent.Between}
                gap={3}
                className="w-full cursor-pointer py-3"
                onClick={() => handleTokenChange(key, !selectedKeys.has(key))}
              >
                <Box
                  flexDirection={BoxFlexDirection.Row}
                  alignItems={BoxAlignItems.Center}
                  gap={3}
                  className="min-w-0"
                >
                  <Checkbox
                    id={`dust-redeem-${key.replace(/[^a-zA-Z0-9_-]/gu, '-')}`}
                    isSelected={selectedKeys.has(key)}
                    onChange={() =>
                      handleTokenChange(key, !selectedKeys.has(key))
                    }
                    onClick={(event) => event.stopPropagation()}
                    inputProps={{
                      'aria-label': t('dustRedeemToken', [token.symbol]),
                      'data-testid': `dust-redeem-token-${token.symbol}`,
                      onClick: (event) => event.stopPropagation(),
                    }}
                  />
                  <BadgeWrapper
                    // BadgeWrapper defaults to self-start, which pins the
                    // avatar to the top of the row.
                    className="shrink-0 self-center"
                    badge={
                      <BadgeNetwork
                        name={
                          networkConfigurationsByChainId[token.chainId as Hex]
                            ?.name
                        }
                        src={getImageForChainId(token.chainId)}
                        data-testid={`dust-redeem-network-${token.symbol}`}
                      />
                    }
                  >
                    <AvatarToken
                      name={token.symbol}
                      src={token.image}
                      size={AvatarTokenSize.Md}
                    />
                  </BadgeWrapper>
                  <Box
                    flexDirection={BoxFlexDirection.Column}
                    className="min-w-0"
                  >
                    <Text
                      variant={TextVariant.BodyMd}
                      fontWeight={FontWeight.Medium}
                      ellipsis
                    >
                      {token.symbol}
                    </Text>
                    <SensitiveText
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                      isHidden={privacyMode}
                      length={SensitiveTextLength.Medium}
                    >
                      {formatTokenQuantity(
                        Number(token.balance ?? 0),
                        token.symbol,
                      )}
                    </SensitiveText>
                  </Box>
                </Box>
                {fiatLabel ? (
                  <SensitiveText
                    variant={TextVariant.BodyMd}
                    fontWeight={FontWeight.Medium}
                    isHidden={privacyMode}
                    length={SensitiveTextLength.Short}
                  >
                    {fiatLabel}
                  </SensitiveText>
                ) : null}
              </Box>
            );
          })}
        </ModalBody>
        <ModalFooter
          primaryButtonProps={{
            children: confirmLabel,
            onClick: handleRedeem,
            isDisabled: selectedTokens.length === 0,
            'data-testid': DUST_REDEEM_CONFIRM_TEST_ID,
          }}
        />
      </ModalContent>
    </Modal>
  );
};
