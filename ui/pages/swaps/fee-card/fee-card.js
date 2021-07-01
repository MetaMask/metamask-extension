import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import InfoTooltip from '../../../components/ui/info-tooltip';
import {
  MAINNET_CHAIN_ID,
  BSC_CHAIN_ID,
  LOCALHOST_CHAIN_ID,
} from '../../../../shared/constants/network';
import TransactionDetail from '../../../components/app/transaction-detail/transaction-detail.component';
import TransactionDetailItem from '../../../components/app/transaction-detail-item/transaction-detail-item.component';
import UserPreferencedCurrencyDisplay from '../../../components/app/user-preferenced-currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';

export default function FeeCard({
  primaryFee,
  secondaryFee,
  hideTokenApprovalRow,
  onFeeCardMaxRowClick,
  tokenApprovalTextComponent,
  tokenApprovalSourceTokenSymbol,
  onTokenApprovalClick,
  metaMaskFee,
  isBestQuote,
  numberOfQuotes,
  onQuotesClick,
  tokenConversionRate,
  chainId,
}) {
  const t = useContext(I18nContext);

  let bestQuoteText = '';
  if (isBestQuote && tokenConversionRate) {
    bestQuoteText = t('swapUsingBestQuote');
  } else if (tokenConversionRate) {
    bestQuoteText = t('swapBetterQuoteAvailable');
  }

  const getTranslatedNetworkName = () => {
    switch (chainId) {
      case MAINNET_CHAIN_ID:
        return t('networkNameEthereum');
      case BSC_CHAIN_ID:
        return t('networkNameBSC');
      case LOCALHOST_CHAIN_ID:
        return t('networkNameTestnet');
      default:
        throw new Error('This network is not supported for token swaps');
    }
  };

  return (
    <div className="fee-card">
      <div className="fee-card__savings-and-quotes-header">
        <div className="fee-card__savings-and-quotes-row">
          {bestQuoteText && (
            <p className="fee-card__savings-text">{bestQuoteText}</p>
          )}
          <div
            className="fee-card__quote-link-container"
            onClick={onQuotesClick}
          >
            <p className="fee-card__quote-link-text">
              {t('swapNQuotes', [numberOfQuotes])}
            </p>
            <div className="fee-card__caret-right">
              <i className="fa fa-angle-up" />
            </div>
          </div>
        </div>
      </div>
      <div className="fee-card__main">
        {process.env.SHOW_EIP_1559_UI && (
          <TransactionDetail
            rows={[
              <TransactionDetailItem
                key="gas-item"
                detailTitle={
                  <>
                    {t('transactionDetailGasHeading')}
                    <InfoTooltip contentText="" position="top">
                      <i className="fa fa-info-circle" />
                    </InfoTooltip>
                  </>
                }
                detailText={primaryFee.fee}
                detailTotal={secondaryFee.fee}
                subTitle="Very likely in < 15 seconds"
                subText={
                  secondaryFee?.maxFee !== undefined && (
                    <>
                      {`${t('swapMaxGasFee')} ${secondaryFee.maxFee}`}
                      <span
                        className="fee-card__edit-link"
                        onClick={() => onFeeCardMaxRowClick()}
                      >
                        {t('edit')}
                      </span>
                    </>
                  )
                }
              />,
            ]}
          />
        )}
        {!process.env.SHOW_EIP_1559_UI && (
          <div className="fee-card__row-header">
            <div>
              <div className="fee-card__row-header-text--bold">
                {t('swapEstimatedNetworkFee')}
              </div>
              <InfoTooltip
                position="top"
                contentText={
                  <>
                    <p className="fee-card__info-tooltip-paragraph">
                      {t('swapNetworkFeeSummary', [getTranslatedNetworkName()])}
                    </p>
                    <p className="fee-card__info-tooltip-paragraph">
                      {t('swapEstimatedNetworkFeeSummary', [
                        <span className="fee-card__bold" key="fee-card-bold-1">
                          {t('swapEstimatedNetworkFee')}
                        </span>,
                      ])}
                    </p>
                    <p className="fee-card__info-tooltip-paragraph">
                      {t('swapMaxNetworkFeeInfo', [
                        <span className="fee-card__bold" key="fee-card-bold-2">
                          {t('swapMaxNetworkFees')}
                        </span>,
                      ])}
                    </p>
                  </>
                }
                containerClassName="fee-card__info-tooltip-content-container"
                wrapperClassName="fee-card__row-label fee-card__info-tooltip-container"
                wide
              />
            </div>
            <div>
              <div className="fee-card__row-header-secondary--bold">
                {primaryFee.fee}
              </div>
              {secondaryFee && (
                <div className="fee-card__row-header-primary--bold">
                  {secondaryFee.fee}
                </div>
              )}
            </div>
          </div>
        )}
        {!process.env.SHOW_EIP_1559_UI && (
          <div
            className="fee-card__row-header"
            onClick={() => onFeeCardMaxRowClick()}
          >
            <div>
              <div className="fee-card__row-header-text">
                {t('swapMaxNetworkFees')}
              </div>
              <div className="fee-card__link">{t('edit')}</div>
            </div>
            <div>
              <div className="fee-card__row-header-secondary">
                {primaryFee.maxFee}
              </div>
              {secondaryFee?.maxFee !== undefined && (
                <div className="fee-card__row-header-primary">
                  {secondaryFee.maxFee}
                </div>
              )}
            </div>
          </div>
        )}

        {!hideTokenApprovalRow && (
          <div className="fee-card__row-header">
            <div className="fee-card__row-label">
              <div className="fee-card__row-header-text">
                {t('swapThisWillAllowApprove', [tokenApprovalTextComponent])}
              </div>
              <InfoTooltip
                position="top"
                contentText={t('swapEnableDescription', [
                  tokenApprovalSourceTokenSymbol,
                ])}
                containerClassName="fee-card__info-tooltip-container"
              />
            </div>
            <div
              className="fee-card__link"
              onClick={() => onTokenApprovalClick()}
            >
              {t('swapEditLimit')}
            </div>
          </div>
        )}
        <div className="fee-card__top-bordered-row">
          <div className="fee-card__row-label">
            <div className="fee-card__row-header-text">
              {t('swapQuoteIncludesRate', [metaMaskFee])}
            </div>
            <InfoTooltip
              position="top"
              contentText={t('swapMetaMaskFeeDescription', [metaMaskFee])}
              wrapperClassName="fee-card__info-tooltip-container"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

FeeCard.propTypes = {
  primaryFee: PropTypes.shape({
    fee: PropTypes.string.isRequired,
    maxFee: PropTypes.string.isRequired,
  }).isRequired,
  secondaryFee: PropTypes.shape({
    fee: PropTypes.string.isRequired,
    maxFee: PropTypes.string.isRequired,
  }),
  onFeeCardMaxRowClick: PropTypes.func.isRequired,
  hideTokenApprovalRow: PropTypes.bool.isRequired,
  tokenApprovalTextComponent: PropTypes.node,
  tokenApprovalSourceTokenSymbol: PropTypes.string,
  onTokenApprovalClick: PropTypes.func,
  metaMaskFee: PropTypes.string.isRequired,
  isBestQuote: PropTypes.bool,
  onQuotesClick: PropTypes.func.isRequired,
  numberOfQuotes: PropTypes.number.isRequired,
  tokenConversionRate: PropTypes.number,
  chainId: PropTypes.string.isRequired,
};
