import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  formatChainIdToCaip,
  formatChainIdToHex,
  isNativeAddress,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { getAccountLink } from '@metamask/etherscan-link';
import { type CaipChainId, parseCaipAssetType } from '@metamask/utils';
import {
  Text,
  TextField,
  TextFieldType,
  ButtonLink,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import {
  formatCurrencyAmount,
  formatTokenAmount,
  sanitizeAmountInput,
} from '../utils/quote';
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
import { MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP } from '../../../../shared/constants/multichain/networks';
import { formatBlockExplorerAddressUrl } from '../../../../shared/lib/multichain/networks';
import { CAIP_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { SelectedAssetButton } from './components/bridge-asset-picker/selected-asset-button';
import { BridgeAssetPicker } from './components/bridge-asset-picker';

export const BridgeInputGroup = ({
  header,
  token,
  onAssetChange,
  onAmountChange,
  networks,
  amountFieldProps,
  amountInFiat,
  onMaxButtonClick,
  onBlockExplorerClick,
  buttonProps,
  accountAddress,
  excludedAssetId,
  containerProps = {},
}: {
  amountInFiat?: string;
  onAmountChange?: (value: string) => void;
  token: BridgeToken;
  buttonProps: { testId: string };
  amountFieldProps: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled' | 'className'
  >;
  onMaxButtonClick?: (value: string) => void;
  onBlockExplorerClick?: (token: BridgeToken) => void;
  networks: { chainId: CaipChainId }[];
  containerProps?: React.ComponentProps<typeof Column>;
} & Pick<
  React.ComponentProps<typeof BridgeAssetPicker>,
  'header' | 'onAssetChange' | 'accountAddress' | 'excludedAssetId'
>) => {
  const t = useI18nContext();

  const { isLoading } = useSelector(getBridgeQuotes);
  const { isInsufficientBalance, isEstimatedReturnLow } =
    useSelector(getValidationErrors);
  const currency = useSelector(getCurrentCurrency);
  const locale = useSelector(getIntlLocale);

  const selectedChainId = token?.chainId;
  const [, handleCopy] = useCopyToClipboard(MINUTE);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const { assetReference } = token ? parseCaipAssetType(token.assetId) : {};
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

  const handleAddressClick = () => {
    if (token && selectedChainId && assetReference) {
      const caipChainId = formatChainIdToCaip(selectedChainId);

      let blockExplorerUrl = '';
      if (isNonEvmChainId(selectedChainId)) {
        const blockExplorerUrls =
          MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[caipChainId];
        if (blockExplorerUrls) {
          blockExplorerUrl = formatBlockExplorerAddressUrl(
            blockExplorerUrls,
            assetReference,
          );
        }
      } else {
        const explorerUrl =
          CAIP_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[
            formatChainIdToCaip(token.chainId)
          ];
        if (explorerUrl) {
          blockExplorerUrl = getAccountLink(
            assetReference,
            formatChainIdToHex(selectedChainId),
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
  const chainIds = useMemo(
    () => networks.map((network) => network.chainId),
    [networks],
  );
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

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
        <BridgeAssetPicker
          excludedAssetId={excludedAssetId}
          selectedAsset={token}
          header={header}
          isOpen={isAssetPickerOpen}
          onClose={() => setIsAssetPickerOpen(false)}
          onAssetChange={(asset) => {
            onAssetChange?.(asset);
          }}
          chainIds={chainIds}
          accountAddress={accountAddress}
        />
        <SelectedAssetButton
          onClick={() => setIsAssetPickerOpen(true)}
          asset={token}
          data-testid={buttonProps.testId}
        />
      </Row>

      <Row justifyContent={JustifyContent.spaceBetween} style={{ height: 24 }}>
        <Text
          variant={TextVariant.bodyMd}
          fontWeight={FontWeight.Normal}
          color={
            isAmountReadOnly && isEstimatedReturnLow
              ? TextColor.warningDefault
              : TextColor.textAlternative
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
                : TextColor.textAlternative
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
          !isNativeAddress(assetReference) && (
            <Text
              display={Display.Flex}
              gap={1}
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              onClick={() => {
                handleAddressClick();
              }}
              as={'a'}
              style={{
                cursor: isAmountReadOnly ? 'pointer' : 'default',
                textDecoration: isAmountReadOnly ? 'underline' : 'none',
              }}
            >
              {shortenString(assetReference, {
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
