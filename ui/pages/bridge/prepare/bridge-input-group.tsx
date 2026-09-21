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
import { Skeleton } from '@metamask/design-system-react';
import {
  IconName,
  Text,
  TextField,
  TextFieldType,
  ButtonLink,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { formatTokenAmount, sanitizeAmountInput } from '../utils/quote';
import { Column, Row } from '../layout';
import {
  Display,
  FontWeight,
  IconColor,
  TextAlign,
  JustifyContent,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import {
  getFromTokenBalance,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { shortenString } from '../../../helpers/utils/util';
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
  amountFieldProps: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled' | 'className'
  >;
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
  const [, handleCopy] = useCopyToClipboard({ clearDelayMs: null });

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

  const inputFontSize = useMemo(() => {
    const len = (amountFieldProps?.value ?? '').toString().length;
    if (len <= 10) {
      return 40;
    }
    if (len <= 15) {
      return 35;
    }
    if (len <= 20) {
      return 30;
    }
    if (len <= 25) {
      return 25;
    }
    return 20;
  }, [amountFieldProps?.value]);

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
          <TextField
            startAccessory={
              amountInputPrefix ? (
                <Text
                  variant={TextVariant.bodyMd}
                  style={{
                    fontSize: inputFontSize,
                    fontWeight: 400,
                    lineHeight: 1,
                  }}
                >
                  {amountInputPrefix}
                </Text>
              ) : undefined
            }
            inputProps={{
              disableStateStyles: true,
              textAlign: TextAlign.Start,
              style: {
                fontWeight: 400,
                fontSize: inputFontSize,
                transition: 'font-size 0.1s',
                padding: 0,
              },
            }}
            style={{
              flex: 1,
              minWidth: 0,
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
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            endIconName={IconName.SwapVertical}
            endIconProps={{ color: IconColor.iconAlternative }}
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
            {secondaryDisplay}
          </Text>
        )}
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
            {formattedTokenAmount}
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
