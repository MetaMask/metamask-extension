import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams, useLocation } from 'react-router-dom';
import { NetworkConfiguration } from '@metamask/network-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import {
  AvatarNetwork,
  AvatarNetworkSize,
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
import { selectBridgeHistoryForAccount } from '../../../ducks/bridge-status/selectors';
import useBridgeChainInfo from '../../../hooks/bridge/useBridgeChainInfo';
import { getNetworkConfigurationsByChainId } from '../../../../shared/modules/selectors/networks';
import { getTransactionBreakdownData } from '../../../components/app/transaction-breakdown/transaction-breakdown-utils';
import { MetaMaskReduxState } from '../../../store/store';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display/user-preferenced-currency-display.component';
import { EtherDenomination } from '../../../../shared/constants/common';
import {
  PRIMARY,
  SUPPORT_REQUEST_LINK,
} from '../../../helpers/constants/common';
import {
  BridgeHistoryItem,
  StatusTypes,
} from '../../../../shared/types/bridge-status';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextTransform,
} from '../../../helpers/constants/design-system';
import { formatDate } from '../../../helpers/utils/util';
import { ConfirmInfoRowDivider as Divider } from '../../../components/app/confirm/info/row';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { selectedAddressTxListSelector } from '../../../selectors';
import {
  MetaMetricsContextProp,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { formatAmount } from '../../confirmations/components/simulation-details/formatAmount';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { TransactionGroup } from '../../../hooks/bridge/useBridgeTxHistoryData';
import TransactionActivityLog from '../../../components/app/transaction-activity-log';
import TransactionDetailRow from './transaction-detail-row';
import BridgeExplorerLinks from './bridge-explorer-links';
import BridgeStepList from './bridge-step-list';

const getBlockExplorerUrl = (
  networkConfiguration: NetworkConfiguration | undefined,
  txHash: string | undefined,
) => {
  if (!networkConfiguration || !txHash) {
    return undefined;
  }
  const index = networkConfiguration.defaultBlockExplorerUrlIndex;
  if (index === undefined) {
    return undefined;
  }

  const rootUrl = networkConfiguration.blockExplorerUrls[index]?.replace(
    /\/$/u,
    '',
  );
  return `${rootUrl}/tx/${txHash}`;
};

/**
 * @param options0
 * @param options0.bridgeHistoryItem
 * @param options0.locale
 * @returns A string representing the bridge amount in decimal form
 */
const getBridgeAmountSentFormatted = ({
  locale,
  bridgeHistoryItem,
}: {
  locale: string;
  bridgeHistoryItem?: BridgeHistoryItem;
}) => {
  if (!bridgeHistoryItem?.pricingData?.amountSent) {
    return undefined;
  }

  return formatAmount(
    locale,
    new BigNumber(bridgeHistoryItem.pricingData.amountSent),
  );
};

const getBridgeAmountReceivedFormatted = ({
  locale,
  bridgeHistoryItem,
}: {
  locale: string;
  bridgeHistoryItem?: BridgeHistoryItem;
}) => {
  if (!bridgeHistoryItem) {
    return undefined;
  }

  const destAmount = bridgeHistoryItem.status.destChain?.amount;
  if (!destAmount) {
    return undefined;
  }

  const destAssetDecimals = bridgeHistoryItem.quote.destAsset.decimals;
  return formatAmount(
    locale,
    new BigNumber(destAmount).dividedBy(10 ** destAssetDecimals),
  );
};

/**
 * @param status - The status of the bridge history item
 * @param bridgeHistoryItem - The bridge history item
 * @returns Whether the bridge history item is delayed
 */
export const getIsDelayed = (
  status: StatusTypes,
  bridgeHistoryItem?: BridgeHistoryItem,
) => {
  return Boolean(
    status === StatusTypes.PENDING &&
      bridgeHistoryItem?.startTime &&
      Date.now() >
        bridgeHistoryItem.startTime +
          bridgeHistoryItem.estimatedProcessingTimeInSeconds * 1000,
  );
};

const StatusToColorMap: Record<StatusTypes, TextColor> = {
  [StatusTypes.PENDING]: TextColor.warningDefault,
  [StatusTypes.COMPLETE]: TextColor.successDefault,
  [StatusTypes.FAILED]: TextColor.errorDefault,
  [StatusTypes.UNKNOWN]: TextColor.errorDefault,
};

const CrossChainSwapTxDetails = () => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const trackEvent = useContext(MetaMetricsContext);
  const rootState = useSelector((state) => state);
  const history = useHistory();
  const location = useLocation();
  const { srcTxMetaId } = useParams<{ srcTxMetaId: string }>();
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const selectedAddressTxList = useSelector(
    selectedAddressTxListSelector,
  ) as TransactionMeta[];

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const { transactionGroup, isEarliestNonce } = location.state as {
    transactionGroup: TransactionGroup;
    isEarliestNonce: boolean;
  };
  const srcChainTxMeta = selectedAddressTxList.find(
    (tx) => tx.id === srcTxMetaId,
  );
  // Even if user is still on /tx-details/txMetaId, we want to be able to show the bridge history item
  const bridgeHistoryItem = srcTxMetaId
    ? bridgeHistory[srcTxMetaId]
    : undefined;

  const { srcNetwork, destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
    srcTxMeta: srcChainTxMeta,
  });

  const srcTxHash = srcChainTxMeta?.hash;
  const srcBlockExplorerUrl = getBlockExplorerUrl(srcNetwork, srcTxHash);

  const destTxHash = bridgeHistoryItem?.status.destChain?.txHash;
  const destBlockExplorerUrl = getBlockExplorerUrl(destNetwork, destTxHash);

  const status = bridgeHistoryItem
    ? bridgeHistoryItem?.status.status
    : StatusTypes.PENDING;

  const srcChainIconUrl = srcNetwork
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        srcNetwork.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ]
    : undefined;

  const destChainIconUrl = destNetwork
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        destNetwork.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ]
    : undefined;

  const srcNetworkName = srcNetwork?.name;
  const destNetworkName = destNetwork?.name;

  const data = srcChainTxMeta
    ? getTransactionBreakdownData({
        state: rootState as MetaMaskReduxState,
        transaction: srcChainTxMeta,
        isTokenApprove: false,
      })
    : undefined;

  const bridgeAmountSent = getBridgeAmountSentFormatted({
    locale,
    bridgeHistoryItem,
  });
  const bridgeAmountReceived = getBridgeAmountReceivedFormatted({
    locale,
    bridgeHistoryItem,
  });
  const isDelayed = getIsDelayed(status, bridgeHistoryItem);

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
    <div className="bridge">
      <div className="bridge__container">
        <Header
          className="bridge__header"
          startAccessory={
            <ButtonIcon
              iconName={IconName.ArrowLeft}
              size={ButtonIconSize.Sm}
              ariaLabel={t('back')}
              onClick={() => history.goBack()}
            />
          }
        >
          {t('bridge')} details
        </Header>
        <Content className="bridge__content">
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
              (bridgeHistoryItem || srcChainTxMeta) && (
                <BridgeStepList
                  bridgeHistoryItem={bridgeHistoryItem}
                  srcChainTxMeta={srcChainTxMeta}
                  networkConfigurationsByChainId={
                    networkConfigurationsByChainId
                  }
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
                    color={status ? StatusToColorMap[status] : undefined}
                  >
                    {status?.toLowerCase()}
                  </Text>
                }
              />
              <TransactionDetailRow
                title={t('bridgeTxDetailsBridging')}
                value={
                  <Box
                    display={Display.Flex}
                    gap={1}
                    alignItems={AlignItems.center}
                  >
                    {srcNetworkIconName}
                    <Icon name={IconName.Arrow2Right} size={IconSize.Sm} />
                    {destNetworkIconName}
                  </Box>
                }
              />
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
                  >
                    {t('bridgeTxDetailsTokenAmountOnChain', [
                      bridgeAmountSent,
                      bridgeHistoryItem?.quote.srcAsset.symbol,
                    ])}
                    {srcNetworkIconName}
                  </Box>
                }
              />
              {bridgeAmountReceived &&
                bridgeHistoryItem?.quote.destAsset.symbol && (
                  <TransactionDetailRow
                    title={t('bridgeTxDetailsYouReceived')}
                    value={
                      <Box
                        display={Display.Flex}
                        gap={1}
                        alignItems={AlignItems.center}
                      >
                        {t('bridgeTxDetailsTokenAmountOnChain', [
                          bridgeAmountReceived,
                          bridgeHistoryItem.quote.destAsset.symbol,
                        ])}
                        {destNetworkIconName}
                      </Box>
                    }
                  />
                )}
              <TransactionDetailRow
                title={t('bridgeTxDetailsTotalGasFee')}
                value={
                  <UserPreferencedCurrencyDisplay
                    currency={data?.nativeCurrency}
                    denomination={EtherDenomination.ETH}
                    numberOfDecimals={6}
                    value={data?.hexGasTotal}
                    type={PRIMARY}
                  />
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

              <TransactionActivityLog
                transactionGroup={transactionGroup}
                className="transaction-list-item-details__transaction-activity-log"
                isEarliestNonce={isEarliestNonce}
              />
            </Box>
          </Box>
        </Content>
      </div>
    </div>
  );
};

export default CrossChainSwapTxDetails;
