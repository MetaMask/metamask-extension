import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import {
  Text,
  TextField,
  TextFieldType,
  ButtonLink,
  PopoverPosition,
  Button,
  ButtonSize,
} from '../../../components/component-library';
import { AssetPicker } from '../../../components/multichain/asset-picker-amount/asset-picker';
import { TabName } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../selectors';
import { formatCurrencyAmount, formatTokenAmount } from '../utils/quote';
import { Column, Row, Tooltip } from '../layout';
import {
  Display,
  FontWeight,
  TextAlign,
  JustifyContent,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { AssetType } from '../../../../shared/constants/transaction';
import { BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE } from '../../../../shared/constants/bridge';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import {
  getBridgeQuotes,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { shortenString } from '../../../helpers/utils/util';
import { BridgeToken } from '../types';
import { BridgeAssetPickerButton } from './components/bridge-asset-picker-button';

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

  const selectedChainId = networkProps?.network?.chainId;

  const blockExplorerUrl =
    networkProps?.network?.defaultBlockExplorerUrlIndex === undefined
      ? undefined
      : networkProps.network.blockExplorerUrls?.[
          networkProps.network.defaultBlockExplorerUrlIndex
        ];

  const { balanceAmount } = useLatestBalance(token, selectedChainId);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isLowReturnTooltipOpen, setIsLowReturnTooltipOpen] = useState(true);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = amountFieldProps?.value?.toString() ?? '';
      inputRef.current.focus();
    }
  }, [amountFieldProps]);

  const isAmountReadOnly =
    amountFieldProps?.readOnly || amountFieldProps?.disabled;

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
          placeholder={'0'}
          onKeyPress={(e?: React.KeyboardEvent<HTMLDivElement>) => {
            // Only allow numbers and at most one decimal point
            if (
              e &&
              !/^[0-9]*\.{0,1}[0-9]*$/u.test(
                `${amountFieldProps.value ?? ''}${e.key}`,
              )
            ) {
              e.preventDefault();
            }
          }}
          onChange={(e) => {
            // Remove characters that are not numbers or decimal points if rendering a controlled or pasted value
            const cleanedValue = e.target.value.replace(/[^0-9.]+/gu, '');
            onAmountChange?.(cleanedValue);
          }}
          {...amountFieldProps}
        />
        <AssetPicker
          header={header}
          visibleTabs={[TabName.TOKENS]}
          asset={token ?? undefined}
          onAssetChange={onAssetChange}
          networkProps={networkProps}
          customTokenListGenerator={customTokenListGenerator}
          isTokenListLoading={isTokenListLoading}
          isMultiselectEnabled={isMultiselectEnabled}
        >
          {(onClickHandler, networkImageSrc) =>
            isAmountReadOnly && !token ? (
              <Button
                onClick={onClickHandler}
                size={ButtonSize.Lg}
                paddingLeft={6}
                paddingRight={6}
                fontWeight={FontWeight.Normal}
                style={{ whiteSpace: 'nowrap' }}
              >
                {t('bridgeTo')}
              </Button>
            ) : (
              <BridgeAssetPickerButton
                onClick={onClickHandler}
                networkImageSrc={networkImageSrc}
                asset={token ?? undefined}
                networkProps={networkProps}
              />
            )
          }
        </AssetPicker>
      </Row>

      <Row justifyContent={JustifyContent.spaceBetween}>
        <Row>
          {isAmountReadOnly &&
            isEstimatedReturnLow &&
            isLowReturnTooltipOpen && (
              <Tooltip
                title={t('lowEstimatedReturnTooltipTitle')}
                position={PopoverPosition.TopStart}
                isOpen={isLowReturnTooltipOpen}
                onClose={() => setIsLowReturnTooltipOpen(false)}
                triggerElement={<span />}
                flip={false}
                offset={[0, 80]}
              >
                {t('lowEstimatedReturnTooltipMessage', [
                  BRIDGE_QUOTE_MAX_RETURN_DIFFERENCE_PERCENTAGE * 100,
                ])}
              </Tooltip>
            )}
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
        >
          {isAmountReadOnly &&
          token &&
          selectedChainId &&
          blockExplorerUrl &&
          token.type === AssetType.token
            ? shortenString(token.address, {
                truncatedCharLimit: 11,
                truncatedStartChars: 4,
                truncatedEndChars: 4,
                skipCharacterInEnd: false,
              })
            : undefined}
          {!isAmountReadOnly && balanceAmount
            ? formatTokenAmount(balanceAmount, token?.symbol)
            : undefined}
          {onMaxButtonClick &&
            token &&
            token.type !== AssetType.native &&
            balanceAmount && (
              <ButtonLink
                variant={TextVariant.bodyMd}
                onClick={() => onMaxButtonClick(balanceAmount?.toString())}
              >
                {t('max')}
              </ButtonLink>
            )}
        </Text>
      </Row>
    </Column>
  );
};
