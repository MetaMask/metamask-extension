import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  formatChainIdToCaip,
  isNativeAddress,
} from '@metamask/bridge-controller';
import { getAccountLink } from '@metamask/etherscan-link';
import {
  Text,
  TextField,
  TextFieldType,
  ButtonLink,
  Button,
  ButtonSize,
} from '../../../components/component-library';
import { AssetPicker } from '../../../components/multichain/asset-picker-amount/asset-picker';
import { TabName } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
import { Column, Row } from '../layout';
import {
  Display,
  FontWeight,
  TextAlign,
  JustifyContent,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  getBridgeQuotes,
  getFromTokenBalance,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { shortenString } from '../../../helpers/utils/util';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useIsMultichainSwap } from '../hooks/useIsMultichainSwap';
import {
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MultichainNetworks,
} from '../../../../shared/constants/multichain/networks';
import { formatBlockExplorerAddressUrl } from '../../../../shared/lib/multichain/networks';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { getMultichainCurrentChainId } from '../../../selectors/multichain';
import { BridgeAssetPickerButton } from './components/bridge-asset-picker-button';

const sanitizeAmountInput = (textToSanitize: string) => {
  // Remove characters that are not numbers or decimal points if rendering a controlled or pasted value
  return (
    textToSanitize
      .replace(/[^\d.]+/gu, '')
      // Only allow one decimal point, ignore digits after second decimal point
      .split('.', 2)
      .join('.')
  );
};

export const BridgeInputGroup = ({
  header,
  token,
  onAssetChange,
  onAmountChange,
  networkProps,
  isTokenListLoading,
  customTokenListGenerator,
  amountFieldProps,
  amountInFiat,
  onMaxButtonClick,
  isMultiselectEnabled,
  onBlockExplorerClick,
  buttonProps,
  containerProps = {},
}: {
  amountInFiat?: string;
  onAmountChange?: (value: string) => void;
  token: BridgeToken | null;
  buttonProps: { testId: string };
  amountFieldProps: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled' | 'className'
  >;
  onMaxButtonClick?: (value: string) => void;
  onBlockExplorerClick?: (token: BridgeToken) => void;
  containerProps?: React.ComponentProps<typeof Column>;
} & Pick<
  React.ComponentProps<typeof AssetPicker>,
  | 'networkProps'
  | 'header'
  | 'customTokenListGenerator'
  | 'onAssetChange'
  | 'isTokenListLoading'
  | 'isMultiselectEnabled'
>) => {
  const t = useI18nContext();

  const { isLoading } = useSelector(getBridgeQuotes);
  const { isInsufficientBalance, isEstimatedReturnLow } =
    useSelector(getValidationErrors);
  const currency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  const currentChainId = useSelector(getMultichainCurrentChainId);
  const selectedChainId = networkProps?.network?.chainId ?? currentChainId;

  const [, handleCopy] = useCopyToClipboard(MINUTE);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const balanceAmount = useSelector(getFromTokenBalance);

  const isAmountReadOnly =
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    amountFieldProps?.readOnly || amountFieldProps?.disabled;

  useEffect(() => {
    if (!isAmountReadOnly && inputRef.current) {
      inputRef.current.value = amountFieldProps?.value?.toString() ?? '';
      inputRef.current.focus();
    }
  }, [amountFieldProps?.value, isAmountReadOnly, token]);

  useEffect(() => {
    return () => {
      inputRef.current = null;
    };
  }, []);

  const isSwap = useIsMultichainSwap();

  const handleAddressClick = () => {
    if (token && selectedChainId) {
      const caipChainId = formatChainIdToCaip(selectedChainId);
      const isSolana = caipChainId === MultichainNetworks.SOLANA;

      let blockExplorerUrl = '';
      if (isSolana) {
        const blockExplorerUrls =
          MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[caipChainId];
        if (blockExplorerUrls) {
          blockExplorerUrl = formatBlockExplorerAddressUrl(
            blockExplorerUrls,
            token.address,
          );
        }
      } else {
        const explorerUrl =
          networkProps?.network?.blockExplorerUrls?.[
            networkProps?.network?.defaultBlockExplorerUrlIndex ?? 0
          ];
        if (explorerUrl) {
          blockExplorerUrl = getAccountLink(
            token.address,
            selectedChainId,
            {
              blockExplorerUrl: explorerUrl,
            },
            undefined,
          );
        }
      }

      if (blockExplorerUrl) {
        handleCopy(blockExplorerUrl);
        onBlockExplorerClick?.(token);
      }
    }
  };

  return (
    <Column gap={1} {...containerProps}>
      <Row gap={4}>
        <TextField
          inputProps={{
            disableStateStyles: true,
            textAlign: TextAlign.Start,
            style: {
              fontWeight: 400,
              fontSize: Math.max(
                14, // Minimum font size
                36 * // Maximum font size
                  // Up to 9 characters, use 36px
                  (9 /
                    // Otherwise, shrink the font size down to 14
                    Math.max(
                      9,
                      (amountFieldProps?.value ?? '').toString().length,
                    )),
              ),
              transition: 'font-size 0.1s',
              padding: 0,
            },
          }}
          style={{
            minWidth: 96,
            maxWidth: 190,
            opacity:
              isAmountReadOnly && amountFieldProps?.value ? 1 : undefined,
          }}
          display={Display.Flex}
          inputRef={inputRef}
          type={TextFieldType.Text}
          className="amount-input"
          placeholder="0"
          onKeyPress={(e?: React.KeyboardEvent<HTMLDivElement>) => {
            if (e) {
              // Only allow numbers and at most one decimal point
              if (
                e.key === '.' &&
                amountFieldProps.value?.toString().includes('.')
              ) {
                e.preventDefault();
              } else if (!/^[\d.]{1}$/u.test(e.key)) {
                e.preventDefault();
              }
            }
          }}
          onPaste={(e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const cleanedValue = sanitizeAmountInput(
              e.clipboardData.getData('text'),
            );
            onAmountChange?.(cleanedValue ?? '');
          }}
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const cleanedValue = sanitizeAmountInput(e.target.value);
            onAmountChange?.(cleanedValue ?? '');
          }}
          {...amountFieldProps}
        />
        <AssetPicker
          header={header}
          visibleTabs={[TabName.TOKENS]}
          asset={(token as never) ?? undefined}
          onAssetChange={onAssetChange}
          networkProps={networkProps}
          customTokenListGenerator={customTokenListGenerator}
          isTokenListLoading={isTokenListLoading}
          isMultiselectEnabled={isMultiselectEnabled}
        >
          {(onClickHandler, networkImageSrc) =>
            isAmountReadOnly && !token ? (
              <Button
                data-testid={buttonProps.testId}
                onClick={onClickHandler}
                size={ButtonSize.Lg}
                paddingLeft={6}
                paddingRight={6}
                fontWeight={FontWeight.Normal}
                style={{ whiteSpace: 'nowrap' }}
              >
                {isSwap ? t('swapSwapTo') : t('bridgeTo')}
              </Button>
            ) : (
              <BridgeAssetPickerButton
                onClick={onClickHandler}
                networkImageSrc={networkImageSrc}
                asset={(token as never) ?? undefined}
                networkProps={networkProps}
                data-testid={buttonProps.testId}
              />
            )
          }
        </AssetPicker>
      </Row>

      <Row justifyContent={JustifyContent.spaceBetween} style={{ height: 24 }}>
        <Text
          variant={TextVariant.bodyMd}
          fontWeight={FontWeight.Normal}
          color={
            isAmountReadOnly && isEstimatedReturnLow
              ? TextColor.warningDefault
              : TextColor.textAlternativeSoft
          }
          textAlign={TextAlign.End}
          ellipsis
        >
          {isAmountReadOnly && isLoading && amountFieldProps.value === '0'
            ? t('bridgeCalculatingAmount')
            : undefined}
          {amountInFiat && formatCurrencyAmount(amountInFiat, currency, 2)}
        </Text>
        {!isAmountReadOnly && balanceAmount && token && (
          <Text
            display={Display.Flex}
            gap={1}
            variant={TextVariant.bodyMd}
            color={
              isInsufficientBalance
                ? TextColor.errorDefault
                : TextColor.textAlternativeSoft
            }
            style={{
              cursor: 'default',
              textDecoration: 'none',
            }}
          >
            {formatTokenAmount(locale, balanceAmount, token.symbol)}
            {onMaxButtonClick && (
              <ButtonLink
                variant={TextVariant.bodyMd}
                onClick={() => onMaxButtonClick(balanceAmount)}
              >
                {t('max')}
              </ButtonLink>
            )}
          </Text>
        )}
        {isAmountReadOnly &&
          token &&
          selectedChainId &&
          !isNativeAddress(token.address) && (
            <Text
              display={Display.Flex}
              gap={1}
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternativeSoft}
              onClick={() => {
                handleAddressClick();
              }}
              as={'a'}
              style={{
                cursor: isAmountReadOnly ? 'pointer' : 'default',
                textDecoration: isAmountReadOnly ? 'underline' : 'none',
              }}
            >
              {shortenString(token.address, {
                truncatedCharLimit: 11,
                truncatedStartChars: 4,
                truncatedEndChars: 4,
                skipCharacterInEnd: false,
              })}
            </Text>
          )}
      </Row>
    </Column>
  );
};
