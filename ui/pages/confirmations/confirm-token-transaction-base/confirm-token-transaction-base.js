import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';
import { getTokenTrackerLink } from '@metamask/etherscan-link';
import { I18nContext } from '../../../contexts/i18n';
import ConfirmTransactionBase from '../confirm-transaction-base';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
import {
  formatCurrency,
  convertTokenToFiat,
  addFiat,
  roundExponential,
} from '../../../helpers/utils/confirm-tx.util';
import { PRIMARY } from '../../../helpers/constants/common';
import {
  contractExchangeRateSelector,
  getSelectedInternalAccount,
  selectConversionRateByChainId,
  selectNetworkConfigurationByChainId,
  selectNftContractsByChainId,
} from '../../../selectors';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { TokenStandard } from '../../../../shared/constants/transaction';
import {
  getWeiHexFromDecimalValue,
  hexWEIToDecETH,
} from '../../../../shared/modules/conversion.utils';
import { EtherDenomination } from '../../../../shared/constants/common';
import { CHAIN_IDS, TEST_CHAINS } from '../../../../shared/constants/network';
import { ETH_DEFAULT_DECIMALS } from '../../../constants';

export default function ConfirmTokenTransactionBase({
  image = '',
  assetName,
  toAddress,
  tokenAddress,
  tokenAmount = '0',
  tokenSymbol,
  tokenId,
  assetStandard,
  onEdit,
  ethTransactionTotal,
  fiatTransactionTotal,
  hexMaximumTransactionFee,
  transaction,
}) {
  const t = useContext(I18nContext);
  const contractExchangeRate = useSelector(contractExchangeRateSelector);
  const { chainId } = transaction;

  const { blockExplorerUrls, nativeCurrency } = useSelector((state) =>
    selectNetworkConfigurationByChainId(state, chainId),
  );

  const blockExplorerUrl = blockExplorerUrls?.[0];
  const currentCurrency = useSelector(getCurrentCurrency);

  const conversionRate = useSelector((state) =>
    selectConversionRateByChainId(state, chainId),
  );

  const { address: userAddress } = useSelector(getSelectedInternalAccount);

  const nftCollections = useSelector((state) =>
    selectNftContractsByChainId(state, chainId),
  );

  const ethTransactionTotalMaxAmount = Number(
    hexWEIToDecETH(hexMaximumTransactionFee),
  ).toFixed(ETH_DEFAULT_DECIMALS);

  const getTitleTokenDescription = (renderType) => {
    const useBlockExplorer =
      blockExplorerUrl ||
      [...TEST_CHAINS, CHAIN_IDS.MAINNET, CHAIN_IDS.LINEA_MAINNET].includes(
        chainId,
      );

    const nftCollection = nftCollections.find(
      (collection) =>
        collection.address.toLowerCase() === tokenAddress.toLowerCase(),
    );
    const titleTokenDescription =
      tokenSymbol || nftCollection?.name || t('unknownCollection');

    if (renderType === 'text') {
      return titleTokenDescription;
    }

    if (useBlockExplorer) {
      const blockExplorerLink = getTokenTrackerLink(
        tokenAddress,
        chainId,
        null,
        userAddress,
        {
          blockExplorerUrl: blockExplorerUrl ?? null,
        },
      );
      const blockExplorerElement = (
        <>
          <a
            href={blockExplorerLink}
            target="_blank"
            rel="noopener noreferrer"
            title={tokenAddress}
            className="confirm-approve-content__approval-asset-link"
          >
            {titleTokenDescription}
          </a>
        </>
      );
      return blockExplorerElement;
    }
    return (
      <>
        <span
          className="confirm-approve-content__approval-asset-title"
          title={tokenAddress}
        >
          {titleTokenDescription}
        </span>
      </>
    );
  };

  const assetImage = image;
  let title, subtitle, subtotalDisplay;
  if (
    assetStandard === TokenStandard.ERC721 ||
    assetStandard === TokenStandard.ERC1155
  ) {
    title = assetName || getTitleTokenDescription();
    subtitle = `#${tokenId}`;
    subtotalDisplay =
      assetName || `${getTitleTokenDescription('text')} #${tokenId}`;
  } else if (assetStandard === TokenStandard.ERC20) {
    title = `${tokenAmount} ${tokenSymbol}`;
    subtotalDisplay = `${tokenAmount} ${tokenSymbol}`;
  }

  const hexWeiValue = useMemo(() => {
    if (tokenAmount === '0' || !contractExchangeRate) {
      return '0';
    }

    const decimalEthValue = new BigNumber(tokenAmount)
      .times(
        new BigNumber(contractExchangeRate ? String(contractExchangeRate) : 0),
      )
      .toFixed();

    return getWeiHexFromDecimalValue({
      value: decimalEthValue,
      fromCurrency: EtherDenomination.ETH,
      fromDenomination: EtherDenomination.ETH,
    });
  }, [tokenAmount, contractExchangeRate]);

  const secondaryTotalTextOverride = useMemo(() => {
    if (typeof contractExchangeRate === 'undefined') {
      return formatCurrency(fiatTransactionTotal, currentCurrency);
    }

    const fiatTransactionAmount = convertTokenToFiat({
      value: tokenAmount,
      toCurrency: currentCurrency,
      conversionRate,
      contractExchangeRate,
    });
    const fiatTotal = addFiat(fiatTransactionAmount, fiatTransactionTotal);
    const roundedFiatTotal = roundExponential(fiatTotal);
    return formatCurrency(roundedFiatTotal, currentCurrency);
  }, [
    currentCurrency,
    conversionRate,
    contractExchangeRate,
    fiatTransactionTotal,
    tokenAmount,
  ]);

  const subtitleComponent = () => {
    if (contractExchangeRate === undefined && subtitle === undefined) {
      return <span>{t('noConversionRateAvailable')}</span>;
    }
    if (subtitle) {
      return <span>{subtitle}</span>;
    }
    return (
      <UserPreferencedCurrencyDisplay
        value={hexWeiValue}
        type={PRIMARY}
        showEthLogo
        hideLabel
      />
    );
  };

  return (
    <ConfirmTransactionBase
      assetStandard={assetStandard}
      toAddress={toAddress}
      image={assetImage}
      onEdit={onEdit}
      tokenAddress={tokenAddress}
      title={title}
      subtitleComponent={subtitleComponent()}
      primaryTotalTextOverride={`${subtotalDisplay} + ${ethTransactionTotal} ${nativeCurrency}`}
      primaryTotalTextOverrideMaxAmount={`${subtotalDisplay} + ${ethTransactionTotalMaxAmount} ${nativeCurrency}`}
      secondaryTotalTextOverride={secondaryTotalTextOverride}
      tokenSymbol={tokenSymbol}
    />
  );
}

ConfirmTokenTransactionBase.propTypes = {
  image: PropTypes.string,
  assetName: PropTypes.string,
  toAddress: PropTypes.string,
  tokenAddress: PropTypes.string,
  tokenAmount: PropTypes.string,
  tokenSymbol: PropTypes.string,
  tokenId: PropTypes.string,
  assetStandard: PropTypes.string,
  onEdit: PropTypes.func,
  ethTransactionTotal: PropTypes.string,
  fiatTransactionTotal: PropTypes.string,
  hexMaximumTransactionFee: PropTypes.string,
  transaction: PropTypes.string,
};
