import React, { useEffect, useMemo, useRef } from 'react';
import { BigNumber } from 'bignumber.js';
import { useSelector, shallowEqual } from 'react-redux';
import {
  FeatureId,
  formatChainIdToCaip,
  formatChainIdToHex,
  isNativeAddress,
  isNonEvmChainId,
  UnifiedSwapBridgeEventName,
} from '@metamask/bridge-controller';
import { getAccountLink } from '@metamask/etherscan-link';
import { parseCaipAssetType } from '@metamask/utils';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  FontFamily,
  Input,
  Skeleton,
  Text,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import {
  IconName as LegacyIconName,
  Text as LegacyText,
  ButtonLink,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatTokenAmount, sanitizeAmountInput } from '../utils/quote';
import { Column, Row } from '../layout';
import {
  Display,
  FontWeight as LegacyFontWeight,
  IconColor as LegacyIconColor,
  TextAlign as LegacyTextAlign,
  JustifyContent,
  TextVariant as LegacyTextVariant,
  TextColor as LegacyTextColor,
} from '../../../helpers/constants/design-system';
import {
  getFromTokenBalance,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { shortenString } from '../../../helpers/utils/util';
import {
  getAmountInputFontSize,
  getAmountInputTextStyle,
} from '../../../helpers/utils/amount-input-font-size';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP } from '../../../../shared/constants/multichain/networks';
import { formatBlockExplorerAddressUrl } from '../../../../shared/lib/multichain/networks';
import { CAIP_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../shared/constants/common';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { trackUnifiedSwapBridgeEvent } from '../../../ducks/bridge/actions';
import { useDispatch } from '../../../store/hooks';
import { useBridgeNavigation } from '../../../hooks/bridge/useBridgeNavigation';
import { SelectedAssetButton } from '../asset-picker/selected-asset-button';

const getBlockExplorerUrl = (
  chainId: BridgeToken['chainId'],
  assetReference: string,
): string | null => {
  const caipChainId = formatChainIdToCaip(chainId);

  if (isNonEvmChainId(chainId)) {
    const blockExplorerUrls =
      MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[caipChainId];
    return blockExplorerUrls
      ? formatBlockExplorerAddressUrl(blockExplorerUrls, assetReference)
      : null;
  }

  const explorerUrl = CAIP_CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[caipChainId];
  return explorerUrl
    ? getAccountLink(
        assetReference,
        formatChainIdToHex(chainId),
        { blockExplorerUrl: explorerUrl },
        undefined,
      )
    : null;
};

// Width of the amount field beside the asset picker in the popup.
const AMOUNT_FIELD_WIDTH = 219;
// Two stacked amount fields cannot fit the 88px start, so the Swap/Bridge
// fields start lower on the same shared scale.
const AMOUNT_FIELD_MAX_FONT_SIZE = 40;

type BridgeAmountFieldProps = {
  testId: string;
  autoFocus?: boolean;
  value?: string;
  readOnly?: boolean;
  disabled?: boolean;
  className?: string;
};

export const BridgeInputGroup = ({
  token,
  onAmountChange,
  amountFieldProps,
  secondaryDisplay,
  amountInputPrefix,
  onAmountTypeToggle,
  onMaxButtonClick,
  onBlockExplorerClick,
  buttonProps,
  containerProps = {},
  isDestination,
  showAmountSkeleton = false,
  setIsAssetPickerOpen,
  tokenSecurityData,
}: {
  setIsAssetPickerOpen: (isOpen: boolean) => void;
  secondaryDisplay?: string;
  amountInputPrefix?: React.ReactNode;
  onAmountTypeToggle?: () => void;
  onAmountChange?: (value: string) => void;
  token: BridgeToken;
  buttonProps: { testId: string };
  amountFieldProps: BridgeAmountFieldProps;
  onMaxButtonClick?: (value: string) => void;
  onBlockExplorerClick?: (token: BridgeToken) => void;
  containerProps?: React.ComponentProps<typeof Column>;
  showAmountSkeleton?: boolean;
  tokenSecurityData?: Pick<BridgeToken, 'isVerified' | 'securityData'>;
  isDestination: boolean;
}) => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { navigateToBridgeAssetPickerPage } = useBridgeNavigation();

  const { isInsufficientBalance, isEstimatedReturnLow } = useSelector(
    getValidationErrors,
    shallowEqual,
  );
  const locale = useSelector(getIntlLocale);

  const selectedChainId = token?.chainId;
  const selectedButtonAsset = useMemo(
    () =>
      tokenSecurityData
        ? {
            ...token,
            isVerified: token.isVerified ?? tokenSecurityData.isVerified,
            securityData: token.securityData ?? tokenSecurityData.securityData,
          }
        : token,
    [token, tokenSecurityData],
  );

  // useCopyToClipboard analysis: Copies a public address
  const [, handleCopy] = useCopyToClipboard();

  const inputRef = useRef<HTMLInputElement | null>(null);
  const assetReference = token
    ? parseCaipAssetType(token.assetId).assetReference
    : undefined;
  const balanceAmount = useSelector(getFromTokenBalance);

  const isAmountReadOnly =
    amountFieldProps?.readOnly || amountFieldProps?.disabled;
  const shouldShowAmountSkeleton = Boolean(
    showAmountSkeleton && isAmountReadOnly,
  );
  const hasAmountInputPrefix = Boolean(amountInputPrefix);
  const previousHasAmountInputPrefix = useRef(hasAmountInputPrefix);
  const formattedTokenAmount = useMemo(() => {
    if (!balanceAmount) {
      return null;
    }

    // Use ROUND_DOWN so the displayed balance never exceeds what the user holds,
    // e.g. 0.00054598 renders as 0.000545 instead of 0.000546.
    return formatTokenAmount(
      locale,
      balanceAmount,
      token.symbol,
      BigNumber.ROUND_DOWN as number,
    );
  }, [locale, balanceAmount, token.symbol]);

  const amountValue = amountFieldProps?.value?.toString() ?? '';
  const amountStyle = getAmountInputTextStyle(
    getAmountInputFontSize(
      `${typeof amountInputPrefix === 'string' ? amountInputPrefix : ''}${amountValue || '0'}`,
      {
        availableWidth: AMOUNT_FIELD_WIDTH,
        maxFontSize: AMOUNT_FIELD_MAX_FONT_SIZE,
      },
    ),
  );

  useEffect(() => {
    const hasAmountInputPrefixChanged =
      previousHasAmountInputPrefix.current !== hasAmountInputPrefix;

    if (!isAmountReadOnly && inputRef.current) {
      inputRef.current.value = amountFieldProps?.value?.toString() ?? '';
      inputRef.current.focus();
      if (hasAmountInputPrefixChanged) {
        inputRef.current.setSelectionRange(
          inputRef.current.value.length,
          inputRef.current.value.length,
        );
      }
    }

    previousHasAmountInputPrefix.current = hasAmountInputPrefix;
  }, [amountFieldProps?.value, hasAmountInputPrefix, isAmountReadOnly, token]);

  useEffect(() => {
    return () => {
      inputRef.current = null;
    };
  }, []);

  const handleAddressClick = () => {
    if (!token || !selectedChainId || !assetReference) {
      return;
    }

    const blockExplorerUrl = getBlockExplorerUrl(
      selectedChainId,
      assetReference,
    );
    if (blockExplorerUrl) {
      handleCopy(blockExplorerUrl);
      onBlockExplorerClick?.(token);
    }
  };

  return (
    <Column gap={1} {...containerProps}>
      <Row gap={4}>
        {shouldShowAmountSkeleton ? (
          <Skeleton
            width={128}
            height={40}
            data-testid={`${amountFieldProps.testId}-loading-skeleton`}
            style={{ flex: 1, minWidth: 0 }}
          />
        ) : (
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            gap={1}
            className={twMerge(
              'amount-input min-w-0 flex-1',
              amountFieldProps.className,
              isAmountReadOnly && !amountValue && 'opacity-50',
            )}
            onClick={() => inputRef.current?.focus()}
          >
            {amountInputPrefix ? (
              <Text
                variant={TextVariant.AmountDisplayLg}
                fontFamily={FontFamily.Hero}
                style={amountStyle}
              >
                {amountInputPrefix}
              </Text>
            ) : null}
            <Input
              ref={inputRef}
              data-testid={amountFieldProps.testId}
              autoFocus={amountFieldProps.autoFocus}
              value={amountValue}
              isReadOnly={amountFieldProps.readOnly}
              isDisabled={amountFieldProps.disabled}
              isStateStylesDisabled
              textVariant={TextVariant.AmountDisplayLg}
              className="min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-left font-hero"
              style={{ ...amountStyle, transition: 'font-size 0.1s' }}
              type="text"
              autoComplete="off"
              placeholder="0"
              onKeyPress={(e) => {
                // Only allow numbers and at most one decimal point
                if (e.key === '.' && amountValue.includes('.')) {
                  e.preventDefault();
                } else if (!/^[\d.]{1}$/u.test(e.key)) {
                  e.preventDefault();
                }
              }}
              onPaste={(e) => {
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
            />
          </Box>
        )}
        <SelectedAssetButton
          onClick={() => {
            dispatch(
              trackUnifiedSwapBridgeEvent(
                UnifiedSwapBridgeEventName.AssetPickerOpened,
                {
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  asset_location: isDestination ? 'destination' : 'source',
                  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  feature_id: FeatureId.UNIFIED_SWAP_BRIDGE,
                },
              ),
            );
            setIsAssetPickerOpen(true);
            navigateToBridgeAssetPickerPage(isDestination ? 'dest' : 'src');
          }}
          asset={selectedButtonAsset}
          data-testid={buttonProps.testId}
        />
      </Row>

      <Row justifyContent={JustifyContent.spaceBetween} style={{ height: 24 }}>
        {onAmountTypeToggle ? (
          <ButtonLink
            variant={LegacyTextVariant.bodyMd}
            color={LegacyTextColor.textAlternative}
            endIconName={LegacyIconName.SwapVertical}
            endIconProps={{ color: LegacyIconColor.iconAlternative }}
            ellipsis
            style={{ textDecoration: 'none' }}
            data-testid="bridge-input-denomination-toggle"
            aria-label={`Toggle input denomination${
              secondaryDisplay ? `, ${secondaryDisplay}` : ''
            }`}
            onClick={onAmountTypeToggle}
          >
            {secondaryDisplay}
          </ButtonLink>
        ) : (
          <LegacyText
            variant={LegacyTextVariant.bodyMd}
            fontWeight={LegacyFontWeight.Normal}
            color={
              isAmountReadOnly && isEstimatedReturnLow
                ? LegacyTextColor.warningDefault
                : LegacyTextColor.textAlternative
            }
            textAlign={LegacyTextAlign.End}
            ellipsis
          >
            {secondaryDisplay}
          </LegacyText>
        )}
        {!isAmountReadOnly && balanceAmount && token && (
          <LegacyText
            display={Display.Flex}
            gap={1}
            variant={LegacyTextVariant.bodyMd}
            color={
              isInsufficientBalance
                ? LegacyTextColor.errorDefault
                : LegacyTextColor.textAlternative
            }
            style={{
              cursor: 'default',
              textDecoration: 'none',
            }}
          >
            {formattedTokenAmount}
            {onMaxButtonClick && (
              <ButtonLink
                variant={LegacyTextVariant.bodyMd}
                onClick={() => onMaxButtonClick(balanceAmount)}
              >
                {t('max')}
              </ButtonLink>
            )}
          </LegacyText>
        )}
        {isAmountReadOnly &&
          token &&
          selectedChainId &&
          !isNativeAddress(assetReference) && (
            <LegacyText
              display={Display.Flex}
              gap={1}
              variant={LegacyTextVariant.bodyMd}
              color={LegacyTextColor.textAlternative}
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
            </LegacyText>
          )}
      </Row>
    </Column>
  );
};
