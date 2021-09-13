import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import InfoTooltip from '../../../components/ui/info-tooltip';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import {
  MAINNET_CHAIN_ID,
  BSC_CHAIN_ID,
  LOCALHOST_CHAIN_ID,
  POLYGON_CHAIN_ID,
  RINKEBY_CHAIN_ID,
} from '../../../../shared/constants/network';
import TransactionDetail from '../../../components/app/transaction-detail/transaction-detail.component';
import TransactionDetailItem from '../../../components/app/transaction-detail-item/transaction-detail-item.component';
import GasTiming from '../../../components/app/gas-timing/gas-timing.component';
import Typography from '../../../components/ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

const GAS_FEES_LEARN_MORE_URL =
  'https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172';

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
  networkAndAccountSupports1559,
  maxPriorityFeePerGasDecGWEI,
  maxFeePerGasDecGWEI,
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
      case POLYGON_CHAIN_ID:
        return t('networkNamePolygon');
      case LOCALHOST_CHAIN_ID:
        return t('networkNameTestnet');
      case RINKEBY_CHAIN_ID:
        return t('networkNameRinkeby');
      default:
        throw new Error('This network is not supported for token swaps');
    }
  };

  const gasFeesLearnMoreLinkClickedEvent = useNewMetricEvent({
    category: 'Swaps',
    event: 'Clicked "Gas Fees: Learn More" Link',
  });

  return (
    <div className="fee-card">
      <div
        className="fee-card__savings-and-quotes-header"
        data-testid="fee-card__savings-and-quotes-header"
      >
        <div className="fee-card__savings-and-quotes-row">
          {bestQuoteText && (
            <p className="fee-card__savings-text">{bestQuoteText}</p>
          )}
          {numberOfQuotes > 1 && (
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
          )}
        </div>
      </div>
      <div className="fee-card__main">
        {networkAndAccountSupports1559 && (
          <TransactionDetail
            rows={[
              <TransactionDetailItem
                key="gas-item"
                detailTitle={
                  <>
                    {t('transactionDetailGasHeading')}
                    <InfoTooltip
                      position="top"
                      contentText={
                        <>
                          <p className="fee-card__info-tooltip-paragraph">
                            {t('swapGasFeesSummary', [
                              getTranslatedNetworkName(),
                            ])}
                          </p>
                          <p className="fee-card__info-tooltip-paragraph">
                            {t('swapGasFeesDetails')}
                          </p>
                          <p className="fee-card__info-tooltip-paragraph">
                            <a
                              className="fee-card__link"
                              onClick={() => {
                                gasFeesLearnMoreLinkClickedEvent();
                                global.platform.openTab({
                                  url: GAS_FEES_LEARN_MORE_URL,
                                });
                              }}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {t('swapGasFeesLearnMore')}
                            </a>
                          </p>
                        </>
                      }
                      containerClassName="fee-card__info-tooltip-content-container"
                      wrapperClassName="fee-card__row-label fee-card__info-tooltip-container"
                      wide
                    />
                  </>
                }
                detailText={primaryFee.fee}
                detailTotal={secondaryFee.fee}
                subTitle={
                  <GasTiming
                    maxPriorityFeePerGas={maxPriorityFeePerGasDecGWEI}
                    maxFeePerGas={maxFeePerGasDecGWEI}
                  />
                }
                subText={
                  secondaryFee?.maxFee !== undefined && (
                    <>
                      <Typography
                        tag="span"
                        fontWeight={FONT_WEIGHT.BOLD}
                        color={COLORS.UI4}
                        variant={TYPOGRAPHY.H7}
                      >
                        {t('maxFee')}
                      </Typography>
                      {`: ${secondaryFee.maxFee}`}
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
        {!networkAndAccountSupports1559 && (
          <div
            className="fee-card__row-header"
            data-testid="fee-card__row-header"
          >
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
        {!networkAndAccountSupports1559 && (
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
  networkAndAccountSupports1559: PropTypes.bool.isRequired,
  maxPriorityFeePerGasDecGWEI: PropTypes.string,
  maxFeePerGasDecGWEI: PropTypes.string,
};
