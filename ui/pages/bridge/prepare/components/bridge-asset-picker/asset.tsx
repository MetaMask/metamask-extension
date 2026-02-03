import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  AvatarNetwork,
  AvatarToken,
  AvatarTokenSize,
  BadgeWrapper,
  Box,
  BoxBackgroundColor,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  formatChainIdToCaip,
  formatChainIdToHex,
  formatAddressToCaipReference,
  isNativeAddress,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import { parseCaipAssetType } from '@metamask/utils';
import {
  PolymorphicRef,
  Tag,
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../../../components/component-library';
import { getCurrentCurrency } from '../../../../../ducks/metamask/metamask';
import { getIntlLocale } from '../../../../../ducks/locale/locale';
import { type BridgeToken } from '../../../../../ducks/bridge/types';
import {
  BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from '../../../../../../shared/constants/bridge';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  IconColor,
} from '../../../../../helpers/constants/design-system';
import { ACCOUNT_TYPE_LABELS } from '../../../../../components/app/assets/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { ASSET_ROUTE } from '../../../../../helpers/constants/routes';
import { Column, Row } from '../../../layout';
import { formatCurrencyAmount, formatTokenAmount } from '../../../utils/quote';

export const BridgeAsset = React.forwardRef(
  <Element extends React.ElementType = typeof Row>(
    {
      asset,
      selected,
      isDestination,
      dataIndex,
      ...buttonProps
    }: React.ComponentProps<typeof Row> & {
      asset: BridgeToken;
      selected: boolean;
      isDestination?: boolean;
      dataIndex: number;
    },
    ref?: PolymorphicRef<Element>,
  ) => {
    const currency = useSelector(getCurrentCurrency);
    const locale = useSelector(getIntlLocale);
    const t = useI18nContext();
    const navigate = useNavigate();

    return (
      <Row
        ref={ref}
        key={asset.assetId}
        data-index={dataIndex}
        {...buttonProps}
        padding={4}
        borderRadius={BorderRadius.none}
        gap={4}
        backgroundColor={
          selected ? BackgroundColor.primaryMuted : BackgroundColor.transparent
        }
        className={`bridge-asset${selected ? '--selected' : ''}`}
        height={BlockSize.Max}
        width={BlockSize.Full}
        data-testid={'bridge-asset'}
      >
        {selected && (
          <Box
            className="multichain-network-list-item__selected-indicator"
            style={{
              borderRadius: BorderRadius.pill,
              position: 'absolute',
            }}
            backgroundColor={BoxBackgroundColor.PrimaryDefault}
          />
        )}
        <BadgeWrapper
          style={{ alignSelf: 'center' }}
          badgeContainerProps={{
            color: BackgroundColor.backgroundDefault,
          }}
          badge={
            <AvatarNetwork
              name={
                NETWORK_TO_SHORT_NETWORK_NAME_MAP[
                  formatChainIdToCaip(asset.chainId)
                ]
              }
              src={
                BRIDGE_CHAIN_ID_TO_NETWORK_IMAGE_MAP[
                  formatChainIdToCaip(asset.chainId)
                ]
              }
              style={{ width: 20, height: 20, borderWidth: 2, borderRadius: 4 }}
              hasBorder
            />
          }
        >
          <AvatarToken
            name={asset.symbol}
            src={asset.iconUrl ?? undefined}
            size={AvatarTokenSize.Md}
          />
        </BadgeWrapper>

        <Column width={BlockSize.Full} style={{ overflow: 'hidden' }}>
          <Row alignItems={AlignItems.flexStart} gap={4}>
            <Row gap={2}>
              <Text ellipsis>{asset.symbol}</Text>
              {asset.accountType && ACCOUNT_TYPE_LABELS[asset.accountType] && (
                <Tag label={ACCOUNT_TYPE_LABELS[asset.accountType]} />
              )}
              {asset.noFee?.[isDestination ? 'isDestination' : 'isSource'] && (
                <Tag label={t('bridgeNoMMFee')} />
              )}
            </Row>
            <Text style={{ whiteSpace: 'nowrap' }}>
              {asset.tokenFiatAmount
                ? formatCurrencyAmount(
                    asset.tokenFiatAmount.toString(),
                    currency,
                    2,
                  )
                : ''}
            </Text>
          </Row>

          <Row alignItems={AlignItems.flexEnd} gap={4}>
            <Text
              ellipsis
              color={TextColor.TextAlternative}
              variant={TextVariant.BodySm}
              style={{ whiteSpace: 'nowrap' }}
            >
              {asset.name ?? asset.symbol}
            </Text>
            <Text
              color={TextColor.TextAlternative}
              variant={TextVariant.BodySm}
              style={{ whiteSpace: 'nowrap' }}
            >
              {asset.balance && asset.balance !== '0'
                ? formatTokenAmount(locale, asset.balance, asset.symbol)
                : ''}
            </Text>
          </Row>
        </Column>

        {isDestination && (
          <ButtonIcon
            iconName={IconName.Info}
            size={ButtonIconSize.Sm}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              e.preventDefault();
              // Parse the CAIP assetId to get the address
              const { assetReference } = parseCaipAssetType(asset.assetId);
              const isNonEvm = isNonEvmChainId(asset.chainId);
              // For EVM: convert CAIP chainId to hex format; for non-EVM: keep CAIP format
              const routeChainId = isNonEvm
                ? asset.chainId
                : formatChainIdToHex(asset.chainId);
              // For EVM: convert assetReference to address; for non-EVM: use CAIP assetId
              const tokenAddress = isNonEvm
                ? asset.assetId
                : formatAddressToCaipReference(assetReference);
              const isNative = isNativeAddress(
                isNonEvm ? assetReference : tokenAddress,
              );

              navigate(
                `${ASSET_ROUTE}/${routeChainId}/${encodeURIComponent(tokenAddress)}`,
                {
                  state: {
                    token: {
                      address: tokenAddress,
                      symbol: asset.symbol,
                      name: asset.name ?? asset.symbol,
                      chainId: routeChainId,
                      image: asset.iconUrl,
                      isNative,
                      decimals: asset.decimals,
                    },
                  },
                },
              );
            }}
            color={IconColor.iconAlternative}
            ariaLabel={t('viewTokenDetails')}
            style={{ alignSelf: 'center' }}
          />
        )}
      </Row>
    );
  },
);
