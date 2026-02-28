import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import {
  Content,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import {
  selectBridgeHistoryItemForTxHash,
  selectLocalTxForTxHash,
  selectReceivedSwapsTokenAmountFromTxMeta,
} from '../../../ducks/bridge-status/selectors';
import { useBridgeTxHistoryData } from '../../../hooks/bridge/useBridgeTxHistoryData';
import useBridgeChainInfo from '../../../hooks/bridge/useBridgeChainInfo';
import { getTransactionBreakdownData } from '../../../components/app/transaction-breakdown/transaction-breakdown-utils';
import type { MetaMaskReduxState } from '../../../store/store';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { SUPPORT_LINK } from '../../../helpers/constants/common';
import { PREVIOUS_ROUTE } from '../../../helpers/constants/routes';
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
import { getNativeTokenInfo } from '../../../selectors';
import { getTransactions } from '../../../selectors/transactions';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { type TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getIntlLocale } from '../../../ducks/locale/locale';
import {
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
  type AllowedBridgeChainIds,
} from '../../../../shared/constants/bridge';
import { Numeric } from '../../../../shared/modules/Numeric';
import { getImageForChainId } from '../../../selectors/multichain';
import { useBridgeTokenDisplayData } from '../hooks/useBridgeTokenDisplayData';
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
  const { trackEvent } = useContext(MetaMetricsContext);
  const rootState = useSelector((state) => state);

  const { txHash } = useParams<{ txHash: string }>();
  const location = useLocation() as {
    state: { transaction?: TransactionViewModel };
  };
  const navigate = useNavigate();
  const allTransactions = useSelector(getTransactions) as TransactionMeta[];

  const localTx = useSelector((state: MetaMaskReduxState) =>
    selectLocalTxForTxHash(state, txHash),
  );
  const transaction = location?.state?.transaction;
  const srcChainTxMeta = localTx ?? transaction;

  const approvalTxMeta = allTransactions.find(
    (tx) => tx.id === bridgeHistoryItem?.approvalTxId,
  );

  const {
    sourceTokenIconUrl,
    sourceTokenSymbol,
    destinationTokenIconUrl,
    destinationTokenSymbol,
  } = useBridgeTokenDisplayData(undefined, transaction);
  const { isBridgeComplete, bridgeTxHistoryItem: bridgeHistoryItem } =
    useBridgeTxHistoryData({
      transactionGroup: undefined,
      transaction,
    });
  const { srcNetwork, destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
    srcTxMeta: srcChainTxMeta,
  });

  const isBridgeTx = srcChainTxMeta?.type === TransactionType.bridge;

  const srcTxHash = srcChainTxMeta?.hash;
  const srcBlockExplorerUrl = getBlockExplorerUrl(srcNetwork, srcTxHash);

  const destTxHash = bridgeHistoryItem?.status.destChain?.txHash;
  const destBlockExplorerUrl = getBlockExplorerUrl(destNetwork, destTxHash);

  const bridgeStatus = bridgeHistoryItem
    ? bridgeHistoryItem?.status.status
    : StatusTypes.PENDING;
  // Show src tx status for swaps
  const status = isBridgeTx ? bridgeStatus : srcChainTxMeta?.status;

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
    txMeta: transaction,
    locale,
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
      txMeta: transaction,
    });

  const isDelayed = isBridgeTx && getIsDelayed(bridgeStatus, bridgeHistoryItem);

  // TODO set for gasless swaps
  const gasCurrency = useSelector((state: MetaMaskReduxState) =>
    getNativeTokenInfo(
      state.metamask.networkConfigurationsByChainId,
      srcChainTxMeta?.chainId ?? '',
    ),
  );

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
    <Page className="bridge__container bg-background-default">
      <Header
        className="bridge__header"
        startAccessory={
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            onClick={() => navigate?.(PREVIOUS_ROUTE)}
          />
        }
      >
        {t(isBridgeTx ? 'bridgeDetailsTitle' : 'swapDetailsTitle')}
      </Header>
      <Content className="bridge-transaction-details__content" gap={4}>
        <React.Fragment>
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
                  href={SUPPORT_LINK}
                  onClick={() => {
                    trackEvent(
                      {
                        category: MetaMetricsEventCategory.Home,
                        event: MetaMetricsEventName.SupportLinkClicked,
                        properties: {
                          url: SUPPORT_LINK,
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
          {!isBridgeComplete &&
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
            {isBridgeTx && bridgeHistoryItem && (
              <TransactionDetailRow
                title={t(
                  isBridgeComplete
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
                    {sourceTokenIconUrl && (
                      <AvatarToken
                        size={AvatarTokenSize.Xs}
                        src={sourceTokenIconUrl}
                        name={sourceTokenSymbol}
                      />
                    )}
                    {sourceTokenSymbol}
                    <Icon name={IconName.Arrow2Right} size={IconSize.Sm} />
                    {destinationTokenIconUrl && (
                      <AvatarToken
                        size={AvatarTokenSize.Xs}
                        src={destinationTokenIconUrl}
                        name={destinationTokenSymbol}
                      />
                    )}
                    {destinationTokenSymbol}
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
                    sourceTokenSymbol ?? '',
                  ])}
                  {srcNetworkIconName}
                </Box>
              }
            />
            {amountReceived && destinationTokenSymbol && (
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
                      destinationTokenSymbol,
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
          </Box>
        </React.Fragment>
      </Content>
    </Page>
  );
};

export default CrossChainSwapTxDetails;
