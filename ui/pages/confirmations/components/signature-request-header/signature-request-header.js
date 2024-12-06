import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { RpcEndpointType } from '@metamask/network-controller';
import { NetworkType } from '@metamask/controller-utils';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { getCurrentCurrency } from '../../../../ducks/metamask/metamask';
import {
  accountsWithSendEtherInfoSelector,
  selectNetworkConfigurationByChainId,
  selectDefaultRpcEndpointByChainId,
} from '../../../../selectors';
import { formatCurrency } from '../../../../helpers/utils/confirm-tx.util';
import {
  getAccountByAddress,
  getNetworkNameFromProviderType,
} from '../../../../helpers/utils/util';
import { EtherDenomination } from '../../../../../shared/constants/common';
import { getValueFromWeiHex } from '../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../shared/modules/Numeric';

import NetworkAccountBalanceHeader from '../../../../components/app/network-account-balance-header';

const SignatureRequestHeader = ({ txData }) => {
  const t = useI18nContext();
  const {
    chainId,
    msgParams: { from },
  } = txData;
  const allAccounts = useSelector(accountsWithSendEtherInfoSelector);
  const fromAccount = getAccountByAddress(allAccounts, from);
  const currentCurrency = useSelector(getCurrentCurrency);

  const { nativeCurrency, name: networkNickname } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const defaultRpcEndpoint = useSelector((state) =>
    selectDefaultRpcEndpointByChainId(state, chainId),
  );

  const networkType =
    defaultRpcEndpoint.type === RpcEndpointType.Custom
      ? NetworkType.rpc
      : defaultRpcEndpoint.networkClientId;

  const networkName = getNetworkNameFromProviderType(networkType);

  const conversionRate = null; // setting conversion rate to null by default to display balance in native

  const currentNetwork =
    networkName === ''
      ? networkNickname || t('unknownNetwork')
      : t(networkName);

  const balanceInBaseAsset = conversionRate
    ? formatCurrency(
        getValueFromWeiHex({
          value: fromAccount.balance,
          fromCurrency: nativeCurrency,
          toCurrency: currentCurrency,
          conversionRate,
          numberOfDecimals: 6,
          toDenomination: EtherDenomination.ETH,
        }),
        currentCurrency,
      )
    : new Numeric(fromAccount.balance, 16, EtherDenomination.WEI)
        .toDenomination(EtherDenomination.ETH)
        .round(6)
        .toBase(10)
        .toString();

  return (
    <NetworkAccountBalanceHeader
      networkName={currentNetwork}
      accountName={fromAccount.metadata.name}
      accountBalance={balanceInBaseAsset}
      tokenName={
        conversionRate ? currentCurrency?.toUpperCase() : nativeCurrency
      }
      accountAddress={fromAccount.address}
      chainId={chainId}
    />
  );
};

SignatureRequestHeader.propTypes = {
  /**
   * The display content of transaction data
   */
  txData: PropTypes.object.isRequired,
};

export default SignatureRequestHeader;
