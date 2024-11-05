import React, { useEffect, useRef } from 'react';
import { Hex } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { SwapsTokenObject } from '../../../../shared/constants/swaps';
import {
  Text,
  TextField,
  TextFieldType,
  SelectButton,
  Icon,
  IconName,
  BadgeWrapper,
  AvatarToken,
  AvatarNetwork,
  AvatarNetworkSize,
  BadgeWrapperPosition,
  AvatarBase,
  IconSize,
  SelectButtonSize,
  ButtonLink,
} from '../../../components/component-library';
import { AssetPicker } from '../../../components/multichain/asset-picker-amount/asset-picker';
import { TabName } from '../../../components/multichain/asset-picker-amount/asset-picker-modal/asset-picker-modal-tabs';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency, SwapsEthToken } from '../../../selectors';
import {
  ERC20Asset,
  NativeAsset,
} from '../../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { zeroAddress } from '../../../__mocks__/ethereumjs-util';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  CHAIN_ID_TO_CURRENCY_SYMBOL_MAP,
  CHAIN_ID_TOKEN_IMAGE_MAP,
} from '../../../../shared/constants/network';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import {
  getBridgeQuotes,
  getFromAmountInFiat,
} from '../../../ducks/bridge/selectors';
import { formatFiatAmount } from '../utils/quote';

import { Column, Row } from '../layout';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FontWeight,
  IconColor,
  JustifyContent,
  OverflowWrap,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { getProviderConfig } from '../../../ducks/metamask/metamask';
import { BridgeToken } from '../types';

const generateAssetFromToken = (
  chainId: Hex,
  tokenDetails: SwapsTokenObject | SwapsEthToken,
): ERC20Asset | NativeAsset => {
  if ('iconUrl' in tokenDetails && tokenDetails.address !== zeroAddress()) {
    return {
      type: AssetType.token,
      image: tokenDetails.iconUrl,
      symbol: tokenDetails.symbol,
      address: tokenDetails.address,
    };
  }

  return {
    type: AssetType.native,
    image:
      CHAIN_ID_TOKEN_IMAGE_MAP[
        chainId as keyof typeof CHAIN_ID_TOKEN_IMAGE_MAP
      ],
    symbol:
      CHAIN_ID_TO_CURRENCY_SYMBOL_MAP[
        chainId as keyof typeof CHAIN_ID_TO_CURRENCY_SYMBOL_MAP
      ],
  };
};

export const BridgeInputGroup = ({
  header,
  token,
  onAssetChange,
  onAmountChange,
  networkProps,
  customTokenListGenerator,
  amountFieldProps,
  onMaxButtonClick,
}: {
  onAmountChange?: (value: string) => void;
  token: BridgeToken | null;
  amountFieldProps: Pick<
    React.ComponentProps<typeof TextField>,
    'testId' | 'autoFocus' | 'value' | 'readOnly' | 'disabled' | 'className'
  >;
  onMaxButtonClick?: (value: string) => void;
} & Pick<
  React.ComponentProps<typeof AssetPicker>,
  'networkProps' | 'header' | 'customTokenListGenerator' | 'onAssetChange'
>) => {
  const t = useI18nContext();

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);
  const fromAmountInFiat = useSelector(getFromAmountInFiat);

  const providerConfig = useSelector(getProviderConfig);
  const isToField = networkProps?.network?.chainId !== providerConfig?.chainId;

  const { formattedBalance } = useLatestBalance(
    token,
    networkProps?.network?.chainId,
  );

  const asset =
    networkProps?.network?.chainId && token
      ? generateAssetFromToken(networkProps.network.chainId, token)
      : undefined;

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = amountFieldProps?.value?.toString() ?? '';
    }
  }, [amountFieldProps.value]);

  return (
    <Column paddingInline={4} gap={1}>
      <Row gap={4}>
        <AssetPicker
          header={header}
          visibleTabs={[TabName.TOKENS]}
          asset={asset}
          onAssetChange={(a) => {
            onAssetChange(a);
            inputRef?.current?.focus();
          }}
          networkProps={networkProps}
          customTokenListGenerator={customTokenListGenerator}
        >
          {(onClickHandler, networkImageSrc) => (
            <SelectButton
              borderRadius={BorderRadius.pill}
              backgroundColor={BackgroundColor.backgroundAlternative}
              style={{
                width: '180px',
                height: '54px',
                maxWidth: '343px',
                border: 'none',
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
              }}
              gap={2}
              size={SelectButtonSize.Lg}
              alignItems={AlignItems.center}
              descriptionProps={{
                variant: TextVariant.bodyMd,
                overflowWrap: OverflowWrap.BreakWord,
                ellipsis: false,
              }}
              caretIconProps={{
                name: IconName.ArrowDown,
                color: IconColor.iconMuted,
              }}
              onClick={onClickHandler}
              label={<Text ellipsis>{asset?.symbol ?? t('bridgeTo')}</Text>}
              description={
                token && networkProps?.network
                  ? t('onNetwork', [networkProps.network.name])
                  : undefined
              }
              startAccessory={
                <BadgeWrapper
                  badge={
                    asset && networkProps?.network?.name ? (
                      <AvatarNetwork
                        name={networkProps.network.name}
                        src={networkImageSrc}
                        size={AvatarNetworkSize.Xs}
                      />
                    ) : undefined
                  }
                  position={BadgeWrapperPosition.bottomRight}
                  badgeContainerProps={{ width: BlockSize.Min }}
                  style={{ alignSelf: 'auto' }}
                >
                  {asset ? (
                    <AvatarToken
                      src={asset.image}
                      backgroundColor={BackgroundColor.backgroundHover}
                      name={asset.symbol}
                    />
                  ) : (
                    <AvatarBase
                      backgroundColor={BackgroundColor.backgroundHover}
                    >
                      <Icon
                        name={IconName.Add}
                        size={IconSize.Sm}
                        color={IconColor.infoInverse}
                      />
                    </AvatarBase>
                  )}
                </BadgeWrapper>
              }
            />
          )}
        </AssetPicker>
        <Column
          style={{ width: 96 }}
          display={
            isToField && !activeQuote && !isLoading
              ? Display.None
              : Display.Flex
          }
        >
          <TextField
            inputRef={inputRef}
            type={TextFieldType.Number}
            className="amount-input"
            style={{ width: '100%', gap: '4px', height: 'fit-content' }}
            placeholder={
              isLoading && !activeQuote && isToField
                ? t('bridgeCalculatingAmount')
                : '0'
            }
            onKeyDown={(e?: React.KeyboardEvent<HTMLDivElement>) => {
              if (e && ['e', '-'].includes(e.key)) {
                e.preventDefault();
              }
            }}
            onChange={(e) => {
              onAmountChange?.(e.target.value);
            }}
            endAccessory={
              (token?.symbol?.length ?? 0) > 6 ||
              (isToField && !activeQuote) ? undefined : (
                <Text
                  style={{ maxWidth: 'fit-content' }}
                  width={BlockSize.Full}
                  fontWeight={FontWeight.Medium}
                  ellipsis
                >
                  {token?.symbol}
                </Text>
              )
            }
            {...amountFieldProps}
          />
          <Text
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Normal}
            color={TextColor.textMuted}
            textAlign={TextAlign.End}
            ellipsis
          >
            {isToField
              ? activeQuote?.toTokenAmount?.fiat &&
                formatFiatAmount(activeQuote?.toTokenAmount?.fiat, currency)
              : formatFiatAmount(fromAmountInFiat, currency)}
          </Text>
        </Column>
      </Row>
      <Row justifyContent={JustifyContent.flexStart} gap={2}>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          style={{ height: 20 }}
        >
          {isToField && token && 'aggregators' in token
            ? t('confirmedBySources', [token.aggregators.length, 'Avascan'])
            : undefined}
          {!isToField && formattedBalance
            ? t('available', [formattedBalance, token?.symbol])
            : undefined}
        </Text>
        {onMaxButtonClick && formattedBalance && (
          <ButtonLink
            variant={TextVariant.bodySmMedium}
            onClick={() => onMaxButtonClick(formattedBalance)}
          >
            {t('max')}
          </ButtonLink>
        )}
      </Row>
    </Column>
  );
};
