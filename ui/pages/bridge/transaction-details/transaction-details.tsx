import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import {
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom-v5-compat';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { formatChainIdToHex, StatusTypes } from '@metamask/bridge-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  AvatarTokenSize,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import { Content, Header } from '../../../components/multichain/pages/page';
import {
  selectBridgeHistoryForAccount,
  selectReceivedSwapsTokenAmountFromTxMeta,
} from '../../../ducks/bridge-status/selectors';
import useBridgeChainInfo from '../../../hooks/bridge/useBridgeChainInfo';
import { getTransactionBreakdownData } from '../../../components/app/transaction-breakdown/transaction-breakdown-utils';
import type { MetaMaskReduxState } from '../../../store/store';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { SUPPORT_REQUEST_LINK } from '../../../helpers/constants/common';
import {
  AlignItems,
  Display,
  FlexDirection,
  FlexWrap,
  JustifyContent,
  TextTransform,
} from '../../../helpers/constants/design-system';
import { formatDate } from '../../../helpers/utils/util';
import { ConfirmInfoRowDivider as Divider } from '../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getNativeTokenInfo,
  selectedAddressTxListSelectorAllChain,
} from '../../../selectors';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getIntlLocale } from '../../../ducks/locale/locale';
import type { TransactionGroup } from '../../../hooks/bridge/useBridgeTxHistoryData';
import TransactionActivityLog from '../../../components/app/transaction-activity-log';
import {
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
  type AllowedBridgeChainIds,
} from '../../../../shared/constants/bridge';
import { Numeric } from '../../../../shared/modules/Numeric';
import { getImageForChainId } from '../../../selectors/multichain';
import { formatTokenAmount } from '../utils/quote';
import {
  getBlockExplorerUrl,
  getBridgeAmountReceivedFormatted,
  getBridgeAmountSentFormatted,
  getIsDelayed,
  STATUS_TO_COLOR_MAP,
} from '../utils/tx-details';
import TransactionDetailRow from './transaction-detail-row';
import BridgeExplorerLinks from './bridge-explorer-links';
import BridgeStepList from './bridge-step-list';

const CrossChainSwapTxDetails = () => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const trackEvent = useContext(MetaMetricsContext);
  const rootState = useSelector((state) => state);
  const navigate = useNavigate();
  const location = useLocation();
  const { srcTxMetaId } = useParams<{ srcTxMetaId: string }>();
  const selectedAddressTxList = useSelector(
    selectedAddressTxListSelectorAllChain,
  ) as TransactionMeta[];

  const transactionGroup: TransactionGroup | null =
    location.state?.transactionGroup || null;
  const isEarliestNonce: boolean | null =
    location.state?.isEarliestNonce || null;
  const srcChainTxMeta = selectedAddressTxList.find(
    (tx) => tx.id === srcTxMetaId,
  );
  // Even if user is still on /tx-details/txMetaId, we want to be able to show the bridge history item
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const bridgeHistoryItem = srcTxMetaId
    ? bridgeHistory[srcTxMetaId]
    : undefined;
  const approvalTxMeta = selectedAddressTxList.find(
    (tx) => tx.id === bridgeHistoryItem?.approvalTxId,
  );

  const { srcNetwork, destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
    srcTxMeta: srcChainTxMeta,
  });

  const srcTxHash = srcChainTxMeta?.hash;
  const srcBlockExplorerUrl = getBlockExplorerUrl(srcNetwork, srcTxHash);

  const destTxHash = bridgeHistoryItem?.status.destChain?.txHash;
  const destBlockExplorerUrl = getBlockExplorerUrl(destNetwork, destTxHash);

  const bridgeStatus = bridgeHistoryItem
    ? bridgeHistoryItem?.status.status
    : StatusTypes.PENDING;
  // Show src tx status for swaps
  const status =
    srcChainTxMeta?.type === TransactionType.bridge
      ? bridgeStatus
      : srcChainTxMeta?.status;

  const srcChainIconUrl = srcNetwork
    ? getImageForChainId(
        srcNetwork.isEvm
          ? formatChainIdToHex(srcNetwork.chainId)
          : srcNetwork.chainId,
      )
    : undefined;

  const destChainIconUrl = destNetwork
    ? getImageForChainId(
        destNetwork.isEvm
          ? formatChainIdToHex(destNetwork.chainId)
          : destNetwork.chainId,
      )
    : undefined;

  const srcNetworkName =
    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      srcNetwork?.chainId as AllowedBridgeChainIds
    ];
  const destNetworkName =
    NETWORK_TO_SHORT_NETWORK_NAME_MAP[
      destNetwork?.chainId as AllowedBridgeChainIds
    ];

  const data = srcChainTxMeta
    ? getTransactionBreakdownData({
        state: rootState as MetaMaskReduxState,
        transaction: srcChainTxMeta,
        isTokenApprove: false,
      })
    : undefined;

  const bridgeAmountSent = getBridgeAmountSentFormatted({
    bridgeHistoryItem,
    txMeta: srcChainTxMeta,
  });

  const swapAmountReceivedFromTxMeta = useSelector((state) =>
    selectReceivedSwapsTokenAmountFromTxMeta(
      state,
      bridgeHistoryItem?.txMetaId,
      srcChainTxMeta,
      approvalTxMeta,
    ),
  );
  const amountReceived =
    (srcChainTxMeta?.type === TransactionType.swap &&
      swapAmountReceivedFromTxMeta) ||
    getBridgeAmountReceivedFormatted({
      locale,
      bridgeHistoryItem,
      txMeta: srcChainTxMeta,
    });

  const isDelayed =
    srcChainTxMeta?.type === TransactionType.bridge &&
    getIsDelayed(bridgeStatus, bridgeHistoryItem);

  // TODO set for gasless swaps
  const gasCurrency = getNativeTokenInfo(
    rootState as MetaMaskReduxState,
    srcChainTxMeta?.chainId ?? '',
  ) as { decimals: number; symbol: string };

  const srcNetworkIconName = (
    <Box display={Display.Flex} gap={1} alignItems={AlignItems.center}>
      {srcNetwork && (
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          src={srcChainIconUrl}
          name={srcNetwork?.name}
        />
      )}
      {srcNetworkName}
    </Box>
  );

  const destNetworkIconName = (
    <Box display={Display.Flex} gap={1} alignItems={AlignItems.center}>
      {destNetwork && (
        <AvatarNetwork
          size={AvatarNetworkSize.Xs}
          src={destChainIconUrl}
          name={destNetwork?.name}
        />
      )}
      {destNetworkName}
    </Box>
  );

  return (
    <div className="bridge__container">
      <Header
        className="bridge__header"
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            onClick={() => navigate(-1)}
          />
        }
      >
        {t(
          srcChainTxMeta?.type === TransactionType.bridge
            ? 'bridgeDetailsTitle'
            : 'swapDetailsTitle',
        )}
      </Header>
      <Content className="bridge-transaction-details__content">
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
        >
          {/* Delayed banner */}
          {isDelayed && (
            <BannerAlert
              title={t('bridgeTxDetailsDelayedTitle')}
              severity={BannerAlertSeverity.Warning}
            >
              <Text display={Display.Flex} alignItems={AlignItems.center}>
                {t('bridgeTxDetailsDelayedDescription')}&nbsp;
                <ButtonLink
                  externalLink
                  href={SUPPORT_REQUEST_LINK}
                  onClick={() => {
                    trackEvent(
                      {
                        category: MetaMetricsEventCategory.Home,
                        event: MetaMetricsEventName.SupportLinkClicked,
                        properties: {
                          url: SUPPORT_REQUEST_LINK,
                          location: 'Bridge Tx Details',
                        },
                      },
                      {
                        contextPropsIntoEventProperties: [
                          MetaMetricsContextProp.PageTitle,
                        ],
                      },
                    );
                  }}
                >
                  {t('bridgeTxDetailsDelayedDescriptionSupport')}
                </ButtonLink>
                .
              </Text>
            </BannerAlert>
          )}

          {/* Bridge step list */}
          {status !== StatusTypes.COMPLETE &&
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            (bridgeHistoryItem || srcChainTxMeta) && (
              <BridgeStepList
                bridgeHistoryItem={bridgeHistoryItem}
                srcChainTxMeta={srcChainTxMeta}
              />
            )}

          {/* Links to block explorers */}
          <BridgeExplorerLinks
            srcChainId={srcNetwork?.chainId}
            destChainId={destNetwork?.chainId}
            srcBlockExplorerUrl={srcBlockExplorerUrl}
            destBlockExplorerUrl={destBlockExplorerUrl}
          />

          <Divider />

          {/* Bridge tx details */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
          >
            <TransactionDetailRow
              title={t('bridgeTxDetailsStatus')}
              value={
                <Text
                  textTransform={TextTransform.Capitalize}
                  color={status ? STATUS_TO_COLOR_MAP[status] : undefined}
                >
                  {status?.toLowerCase()}
                </Text>
              }
            />
            {srcChainTxMeta?.type === TransactionType.bridge && (
              <TransactionDetailRow
                title={t(
                  status === StatusTypes.COMPLETE
                    ? 'bridgeTxDetailsBridged'
                    : 'bridgeTxDetailsBridging',
                )}
                value={
                  <Box
                    display={Display.Flex}
                    gap={1}
                    alignItems={AlignItems.center}
                    flexWrap={FlexWrap.Wrap}
                    justifyContent={JustifyContent.flexEnd}
                  >
                    {srcNetworkIconName}
                    <Icon name={IconName.Arrow2Right} size={IconSize.Sm} />
                    {destNetworkIconName}
                  </Box>
                }
              />
            )}
            {srcChainTxMeta?.type === TransactionType.swap && (
              <TransactionDetailRow
                title={t(
                  srcChainTxMeta?.status === TransactionStatus.confirmed
                    ? 'bridgeTxDetailsSwapped'
                    : 'bridgeTxDetailsSwapping',
                )}
                value={
                  <Box
                    display={Display.Flex}
                    gap={1}
                    alignItems={AlignItems.center}
                    flexWrap={FlexWrap.Wrap}
                    justifyContent={JustifyContent.flexEnd}
                  >
                    {bridgeHistoryItem && (
                      <AvatarToken
                        size={AvatarTokenSize.Xs}
                        src={
                          bridgeHistoryItem?.quote.srcAsset.iconUrl ?? undefined
                        }
                        name={bridgeHistoryItem?.quote.srcAsset.symbol}
                      />
                    )}
                    {bridgeHistoryItem?.quote.srcAsset.symbol}
                    <Icon name={IconName.Arrow2Right} size={IconSize.Sm} />
                    {bridgeHistoryItem && (
                      <AvatarToken
                        size={AvatarTokenSize.Xs}
                        src={
                          bridgeHistoryItem?.quote.destAsset.iconUrl ??
                          undefined
                        }
                        name={bridgeHistoryItem?.quote.destAsset.symbol}
                      />
                    )}
                    {bridgeHistoryItem?.quote.destAsset.symbol}
                  </Box>
                }
              />
            )}
            <TransactionDetailRow
              title={t('bridgeTxDetailsTimestamp')}
              value={t('bridgeTxDetailsTimestampValue', [
                formatDate(srcChainTxMeta?.time, 'MMM d, yyyy'),
                formatDate(srcChainTxMeta?.time, 'hh:mm a'),
              ])}
            />
          </Box>

          <Divider />

          {/* Bridge tx details 2 */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
          >
            <TransactionDetailRow
              title={t('bridgeTxDetailsYouSent')}
              value={
                <Box
                  display={Display.Flex}
                  gap={1}
                  alignItems={AlignItems.center}
                  flexWrap={FlexWrap.Wrap}
                  justifyContent={JustifyContent.flexEnd}
                >
                  {t('bridgeTxDetailsTokenAmountOnChain', [
                    bridgeAmountSent ?? '',
                    bridgeHistoryItem?.quote.srcAsset.symbol ?? '',
                  ])}
                  {srcNetworkIconName}
                </Box>
              }
            />
            {amountReceived && bridgeHistoryItem?.quote.destAsset.symbol && (
              <TransactionDetailRow
                title={t('bridgeTxDetailsYouReceived')}
                value={
                  <Box
                    display={Display.Flex}
                    gap={1}
                    alignItems={AlignItems.center}
                    flexWrap={FlexWrap.Wrap}
                    justifyContent={JustifyContent.flexEnd}
                  >
                    {t('bridgeTxDetailsTokenAmountOnChain', [
                      amountReceived,
                      bridgeHistoryItem?.quote.destAsset.symbol,
                    ])}
                    {destNetworkIconName}
                  </Box>
                }
              />
            )}
            <TransactionDetailRow
              title={t('bridgeTxDetailsTotalGasFee')}
              value={
                <>
                  {data?.hexGasTotal &&
                    gasCurrency?.decimals &&
                    gasCurrency?.symbol &&
                    formatTokenAmount(
                      locale,
                      new Numeric(data.hexGasTotal, 16)
                        .toBase(10)
                        .shiftedBy(gasCurrency.decimals ?? 0)
                        .toString(),
                      gasCurrency?.symbol,
                    )}
                </>
              }
            />
          </Box>

          <Divider />

          {/* Generic tx details */}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={2}
          >
            <TransactionDetailRow
              title={t('bridgeTxDetailsNonce')}
              value={
                srcChainTxMeta?.txParams.nonce
                  ? hexToDecimal(srcChainTxMeta?.txParams.nonce)
                  : undefined
              }
            />
            {transactionGroup && typeof isEarliestNonce !== 'undefined' && (
              <TransactionActivityLog
                transactionGroup={transactionGroup}
                className="transaction-list-item-details__transaction-activity-log"
                isEarliestNonce={isEarliestNonce}
              />
            )}
          </Box>
        </Box>
      </Content>
    </div>
  );
};

export default CrossChainSwapTxDetails;
