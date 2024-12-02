import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { NetworkConfiguration } from '@metamask/network-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  BannerAlert,
  BannerAlertSeverity,
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
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
import CurrencyDisplay from '../../../components/ui/currency-display/currency-display.component';
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
 * @returns A string representing the bridge amount in decimal form
 */
const getBridgeAmount = ({
  bridgeHistoryItem,
}: {
  bridgeHistoryItem?: BridgeHistoryItem;
}) => {
  if (bridgeHistoryItem) {
    return bridgeHistoryItem.pricingData?.amountSent;
  }

  return undefined;
};

const getIsDelayed = (
  status: StatusTypes,
  bridgeHistoryItem: BridgeHistoryItem,
) => {
  return (
    status === StatusTypes.PENDING &&
    bridgeHistoryItem.startTime &&
    Date.now() >
      bridgeHistoryItem.startTime +
        bridgeHistoryItem.estimatedProcessingTimeInSeconds * 1000
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
  const trackEvent = useContext(MetaMetricsContext);
  const rootState = useSelector((state) => state);
  const history = useHistory();
  const { srcTxMetaId } = useParams<{ srcTxMetaId: string }>();
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const selectedAddressTxList = useSelector(
    selectedAddressTxListSelector,
  ) as TransactionMeta[];

  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

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

  const destChainIconUrl = destNetwork
    ? CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
        destNetwork.chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
      ]
    : undefined;
  const bridgeTypeDirection = t('bridgeTypeDirectionTo');
  const srcNetworkName = srcNetwork?.name;
  const destNetworkName = destNetwork?.name;

  const data = srcChainTxMeta
    ? getTransactionBreakdownData({
        state: rootState as MetaMaskReduxState,
        transaction: srcChainTxMeta,
        isTokenApprove: false,
      })
    : undefined;

  const bridgeAmount = getBridgeAmount({ bridgeHistoryItem });
  const isDelayed = getIsDelayed(status, bridgeHistoryItem);

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
            {isDelayed && (
              <BannerAlert
                title={t('bridgeTxDetailsDelayedTitle')}
                severity={BannerAlertSeverity.Warning}
              >
                <Text>
                  {t('bridgeTxDetailsDelayedDescription')}{' '}
                  <ButtonLink
                    onClick={() => {
                      global.platform.openTab({
                        url:
                          SUPPORT_REQUEST_LINK ||
                          'https://support.metamask.io/',
                      });
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
                </Text>
              </BannerAlert>
            )}

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

            {/* General tx details */}
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

              {status !== StatusTypes.COMPLETE && (
                <TransactionDetailRow
                  title={t('bridgeTxDetailsBridgeType')}
                  value={
                    <Box
                      display={Display.Flex}
                      gap={1}
                      alignItems={AlignItems.baseline}
                    >
                      {bridgeTypeDirection}{' '}
                      {destNetwork && (
                        <AvatarNetwork
                          size={AvatarNetworkSize.Xs}
                          src={destChainIconUrl}
                          name={destNetwork?.name}
                        />
                      )}
                      {destNetworkName}
                    </Box>
                  }
                />
              )}
              {status === StatusTypes.COMPLETE && (
                <>
                  <TransactionDetailRow
                    title={t('bridgeSource')}
                    value={srcNetworkName}
                  />
                  <TransactionDetailRow
                    title={t('bridgeDestination')}
                    value={destNetworkName}
                  />
                </>
              )}
              <TransactionDetailRow
                title={t('bridgeTxDetailsTimestamp')}
                value={t('bridgeTxDetailsTimestampValue', [
                  formatDate(srcChainTxMeta?.time, 'MMM d, yyyy'),
                  formatDate(srcChainTxMeta?.time, 'hh:mm a'),
                ])}
              />
              <TransactionDetailRow
                title={t('bridgeTxDetailsNonce')}
                value={
                  srcChainTxMeta?.txParams.nonce
                    ? hexToDecimal(srcChainTxMeta?.txParams.nonce)
                    : undefined
                }
              />
            </Box>

            <Divider />

            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              <TransactionDetailRow
                title={t('bridgeTxDetailsBridgeAmount')}
                value={bridgeAmount}
              />
              <TransactionDetailRow
                title={t('bridgeTxDetailsGasLimit')}
                value={data?.gas ? hexToDecimal(data?.gas) : undefined}
              />
              <TransactionDetailRow
                title={t('bridgeTxDetailsGasUsed')}
                value={data?.gasUsed ? hexToDecimal(data?.gasUsed) : undefined}
              />
              {data?.isEIP1559Transaction &&
                typeof data?.baseFee !== 'undefined' && (
                  <TransactionDetailRow
                    title={t('bridgeTxDetailsBaseFee')}
                    value={
                      <CurrencyDisplay
                        currency={data?.nativeCurrency}
                        denomination={EtherDenomination.GWEI}
                        value={data?.baseFee}
                        numberOfDecimals={10}
                        hideLabel
                      />
                    }
                  />
                )}
              {data?.isEIP1559Transaction &&
                typeof data?.priorityFee !== 'undefined' && (
                  <TransactionDetailRow
                    title={t('bridgeTxDetailsPriorityFee')}
                    value={
                      <CurrencyDisplay
                        currency={data?.nativeCurrency}
                        denomination={EtherDenomination.GWEI}
                        value={data?.priorityFee}
                        numberOfDecimals={10}
                        hideLabel
                      />
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
              <TransactionDetailRow
                title={t('bridgeTxDetailsMaxFeePerGas')}
                value={
                  <UserPreferencedCurrencyDisplay
                    currency={data?.nativeCurrency}
                    denomination={EtherDenomination.ETH}
                    numberOfDecimals={9}
                    value={data?.maxFeePerGas}
                    type={PRIMARY}
                  />
                }
              />
            </Box>

            <Divider />

            <TransactionDetailRow
              title={t('bridgeTxDetailsTotal')}
              value={
                <UserPreferencedCurrencyDisplay
                  type={PRIMARY}
                  value={data?.totalInHex}
                  numberOfDecimals={data?.l1HexGasTotal ? 18 : undefined}
                />
              }
            />

            <Divider />
          </Box>
        </Content>
      </div>
    </div>
  );
};

export default CrossChainSwapTxDetails;
