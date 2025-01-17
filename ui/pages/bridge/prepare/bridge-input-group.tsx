import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
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
import { isNativeAddress } from '../../../../shared/modules/bridge-utils/caip-formatters';
import { Column, Row } from '../layout';
import {
  Display,
  FontWeight,
  TextAlign,
  JustifyContent,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import {
  getBridgeQuotes,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { shortenString } from '../../../helpers/utils/util';
import type { BridgeToken } from '../../../../shared/types/bridge';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { MINUTE } from '../../../../shared/constants/time';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { useIsMultichainSwap } from '../hooks/useIsMultichainSwap';
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
}: {
  amountInFiat?: BigNumber;
  onAmountChange?: (value: string) => void;
  token: BridgeToken | null;
  amountFieldProps: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled' | 'className'
  >;
  onMaxButtonClick?: (value: string) => void;
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

  const selectedChainId = networkProps?.network?.chainId;
  const balanceAmount = useLatestBalance(token, selectedChainId);

  const [, handleCopy] = useCopyToClipboard(MINUTE) as [
    boolean,
    (text: string) => void,
  ];

  const inputRef = useRef<HTMLInputElement | null>(null);

  const isAmountReadOnly =
    amountFieldProps?.readOnly || amountFieldProps?.disabled;

  useEffect(() => {
    if (!isAmountReadOnly && inputRef.current) {
      inputRef.current.value = amountFieldProps?.value?.toString() ?? '';
      inputRef.current.focus();
    }
  }, [amountFieldProps?.value, isAmountReadOnly, token]);

  const isSwap = useIsMultichainSwap();

  return (
    <Column paddingInline={6} gap={1}>
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
                data-testid='bridge-destination-button'
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
              />
            )
          }
        </AssetPicker>
      </Row>

      <Row justifyContent={JustifyContent.spaceBetween}>
        <Row>
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
        </Row>
        <Text
          display={Display.Flex}
          gap={1}
          variant={TextVariant.bodyMd}
          color={
            !isAmountReadOnly && isInsufficientBalance(balanceAmount)
              ? TextColor.errorDefault
              : TextColor.textAlternativeSoft
          }
          onClick={() => {
            if (isAmountReadOnly && token && selectedChainId) {
              handleCopy(token.address);
            }
          }}
          as={isAmountReadOnly ? 'a' : 'p'}
        >
          {isAmountReadOnly &&
            token &&
            selectedChainId &&
            (isNativeAddress(token.address)
              ? undefined
              : shortenString(token.address.split(':').at(-1), {
                  truncatedCharLimit: 11,
                  truncatedStartChars: 4,
                  truncatedEndChars: 4,
                  skipCharacterInEnd: false,
                }))}
          {!isAmountReadOnly && balanceAmount
            ? formatTokenAmount(locale, balanceAmount, token?.symbol)
            : undefined}
          {onMaxButtonClick &&
            token &&
            !isNativeAddress(token.address) &&
            balanceAmount && (
              <ButtonLink
                variant={TextVariant.bodyMd}
                onClick={() => onMaxButtonClick(balanceAmount?.toFixed())}
              >
                {t('max')}
              </ButtonLink>
            )}
        </Text>
      </Row>
    </Column>
  );
};
