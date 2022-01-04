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
import Typography from '../../../components/ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import GasDetailsItemTitle from '../../confirm-transaction-base/gas-details-item/gas-details-item-title';

const GAS_FEES_LEARN_MORE_URL =
  'https://community.metamask.io/t/what-is-gas-why-do-transactions-take-so-long/3172';

export default function FeeCard({
  primaryFee,
  secondaryFee,
  hideTokenApprovalRow,
  onFeeCardMaxRowClick,
  tokenApprovalSourceTokenSymbol,
  onTokenApprovalClick,
  metaMaskFee,
  numberOfQuotes,
  onQuotesClick,
  chainId,
  isBestQuote,
  supportsEIP1559V2,
}) {
  const t = useContext(I18nContext);

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

  const tokenApprovalTextComponent = (
    <span key="fee-card-approve-symbol" className="fee-card__bold">
      {t('enableToken', [tokenApprovalSourceTokenSymbol])}
    </span>
  );

  return (
    <div className="fee-card">
      <div className="fee-card__main">
        <TransactionDetail
          rows={[
            <TransactionDetailItem
              key="gas-item"
              detailTitle={
                supportsEIP1559V2 ? (
                  <GasDetailsItemTitle />
                ) : (
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
                )
              }
              detailText={primaryFee.fee}
              detailTotal={secondaryFee.fee}
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
                    {!supportsEIP1559V2 && (
                      <span
                        className="fee-card__edit-link"
                        onClick={() => onFeeCardMaxRowClick()}
                      >
                        {t('edit')}
                      </span>
                    )}
                  </>
                )
              }
            />,
          ]}
        />
        {!hideTokenApprovalRow && (
          <div className="fee-card__row-header">
            <div className="fee-card__row-label">
              <div className="fee-card__row-header-text">
                {t('swapEnableTokenForSwapping', [tokenApprovalTextComponent])}
                <InfoTooltip
                  position="top"
                  contentText={t('swapEnableDescription', [
                    tokenApprovalSourceTokenSymbol,
                  ])}
                  containerClassName="fee-card__info-tooltip-container"
                />
              </div>
            </div>
            <div
              className="fee-card__link"
              onClick={() => onTokenApprovalClick()}
            >
              {t('swapEditLimit')}
            </div>
          </div>
        )}
        <div className="fee-card__row-header">
          <div className="fee-card__row-label">
            <div className="fee-card__row-header-text">
              {numberOfQuotes > 1 && (
                <span
                  onClick={onQuotesClick}
                  className="fee-card__quote-link-text"
                >
                  {isBestQuote
                    ? t('swapBestOfNQuotes', [numberOfQuotes])
                    : t('swapNQuotesWithDot', [numberOfQuotes])}
                </span>
              )}
              {t('swapIncludesMMFee', [metaMaskFee])}
              <InfoTooltip
                position="top"
                contentText={t('swapMetaMaskFeeDescription', [metaMaskFee])}
                wrapperClassName="fee-card__info-tooltip-container"
              />
            </div>
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
  tokenApprovalSourceTokenSymbol: PropTypes.string,
  onTokenApprovalClick: PropTypes.func,
  metaMaskFee: PropTypes.string.isRequired,
  onQuotesClick: PropTypes.func.isRequired,
  numberOfQuotes: PropTypes.number.isRequired,
  chainId: PropTypes.string.isRequired,
  isBestQuote: PropTypes.bool.isRequired,
  supportsEIP1559V2: PropTypes.bool.isRequired,
};
