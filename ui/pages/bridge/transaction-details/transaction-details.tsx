import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';
import { I18nContext } from '../../../contexts/i18n';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '../../../components/component-library';
import {
  Content,
  Footer,
  Header,
} from '../../../components/multichain/pages/page';
import { selectBridgeHistoryForAccount } from '../../../ducks/bridge-status/selectors';
import useBridgeChainInfo from '../utils/useBridgeChainInfo';
import { NetworkConfiguration } from '@metamask/network-controller';
import { selectedAddressTxListSelector } from '../../../selectors';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Numeric } from '../../../../shared/modules/Numeric';

const getBlockExplorerUrl = (
  networkConfiguration: NetworkConfiguration | undefined,
  txHash: string | undefined,
) =>
  networkConfiguration?.defaultBlockExplorerUrlIndex !== undefined && txHash
    ? networkConfiguration.blockExplorerUrls[
        networkConfiguration.defaultBlockExplorerUrlIndex
      ]?.replace(/\/$/, '') + txHash
    : undefined;

const CrossChainSwapTxDetails = () => {
  const t = useContext(I18nContext);
  const history = useHistory();
  const { srcTxHash } = useParams<{ srcTxHash: string }>();
  const bridgeHistory = useSelector(selectBridgeHistoryForAccount);
  const selectedAddressTxList = useSelector(
    selectedAddressTxListSelector,
  ) as TransactionMeta[];
  const bridgeHistoryItem = srcTxHash ? bridgeHistory[srcTxHash] : undefined;
  const { srcNetworkConfiguration, destNetworkConfiguration } =
    useBridgeChainInfo({
      bridgeHistoryItem,
    });

  const srcBlockExplorerUrl = getBlockExplorerUrl(
    srcNetworkConfiguration,
    srcTxHash,
  );

  const destTxHash = bridgeHistoryItem?.status?.destChain?.txHash;
  const destBlockExplorerUrl = getBlockExplorerUrl(
    destNetworkConfiguration,
    destTxHash,
  );

  const txMeta = selectedAddressTxList.find((tx) => tx.hash === srcTxHash);
  const nonce = txMeta?.txParams?.nonce
    ? new Numeric(txMeta?.txParams?.nonce, 16).toBase(10).toString()
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
          <div>
            <div>tx 1</div>
            <div>{srcBlockExplorerUrl}</div>
          </div>
          <div>
            <div>tx 2</div>
            <div>{destBlockExplorerUrl}</div>
          </div>
          <div>Status: {bridgeHistoryItem?.status?.status}</div>
          <div>Bridge type: From {srcNetworkConfiguration?.name}</div>
          <div>Timestamp: {bridgeHistoryItem?.startTime}</div>
          <div>Nonce: {nonce}</div>
          <div>Bridge amount {bridgeHistoryItem?.quote.srcTokenAmount}</div>
          <div>Gas limit (units)</div>
          <div>Gas used (units)</div>
          <div>Base fee (GWEI)</div>
          <div>Priority fee (GWEI)</div>
        </Content>
      </div>
    </div>
  );
};

export default CrossChainSwapTxDetails;
