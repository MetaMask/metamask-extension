import React from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { NetworkConfiguration } from '@metamask/network-controller';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  Box,
  ButtonIcon,
  ButtonIconSize,
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
import { PRIMARY } from '../../../helpers/constants/common';
import CurrencyDisplay from '../../../components/ui/currency-display/currency-display.component';
import { StatusTypes } from '../../../../shared/types/bridge-status';
import {
  AlignItems,
  Display,
  FlexDirection,
  TextColor,
  TextTransform,
} from '../../../helpers/constants/design-system';
import { formatDate } from '../../../helpers/utils/util';
import { ConfirmInfoRowDivider as Divider } from '../../../components/app/confirm/info/row';
import { calcTokenAmount } from '../../../../shared/lib/transactions-controller-utils';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../shared/constants/network';
import { selectedAddressTxListSelector } from '../../../selectors';
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

const StatusToColorMap: Record<StatusTypes, TextColor> = {
  [StatusTypes.PENDING]: TextColor.warningDefault,
  [StatusTypes.COMPLETE]: TextColor.successDefault,
  [StatusTypes.FAILED]: TextColor.errorDefault,
  [StatusTypes.UNKNOWN]: TextColor.errorDefault,
};

const CrossChainSwapTxDetails = () => {
  const t = useI18nContext();
  const rootState = useSelector((state) => state);
  const history = useHistory();
  // we should be able to use a srcTxHash or a txMeta.id, STX won't have txHash right away
  const { srcTxHashOrTxId } = useParams<{ srcTxHashOrTxId: string }>();
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const selectedAddressTxList = useSelector(
    selectedAddressTxListSelector,
  ) as TransactionMeta[];

  const bridgeHistoryItem = srcTxHashOrTxId
    ? bridgeHistory[srcTxHashOrTxId]
    : undefined;
  const networkConfigurationsByChainId = useSelector(
    getNetworkConfigurationsByChainId,
  );

  const srcChainTxMeta = selectedAddressTxList.find(
    (tx) => tx.hash === srcTxHashOrTxId || tx.id === srcTxHashOrTxId,
  );

  const { srcNetwork, destNetwork } = useBridgeChainInfo({
    bridgeHistoryItem,
    srcTxMeta: srcChainTxMeta,
  });

  const srcBlockExplorerUrl = getBlockExplorerUrl(srcNetwork, srcTxHashOrTxId);

  const destTxHash = bridgeHistoryItem?.status.destChain?.txHash;
  const destBlockExplorerUrl = getBlockExplorerUrl(destNetwork, destTxHash);

  const status = bridgeHistoryItem?.status.status;

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

  const bridgeAmount = bridgeHistoryItem
    ? `${calcTokenAmount(
        bridgeHistoryItem.quote.srcTokenAmount,
        bridgeHistoryItem.quote.srcAsset.decimals,
      ).toFixed()} ${bridgeHistoryItem.quote.srcAsset.symbol}`
    : undefined;

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
