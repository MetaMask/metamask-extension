import React, { useContext } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import { I18nContext } from '../../../contexts/i18n';
import InfoTooltip from '../../../components/ui/info-tooltip';
import TransactionDetail from '../../confirmations/components/transaction-detail/transaction-detail.component';
import TransactionDetailItem from '../../confirmations/components/transaction-detail-item/transaction-detail-item.component';
import {
  TextColor,
  TextVariant,
  FontWeight,
} from '../../../helpers/constants/design-system';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { MetaMetricsEventCategory } from '../../../../shared/constants/metametrics';
import { getUseCurrencyRateCheck } from '../../../selectors';
import {
  Text,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';

export default function FeeCard({
  primaryFee,
  secondaryFee,
  hideTokenApprovalRow,
  tokenApprovalSourceTokenSymbol,
  onTokenApprovalClick,
  metaMaskFee,
  numberOfQuotes,
  onQuotesClick,
}) {
  const t = useContext(I18nContext);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  const { trackEvent } = useContext(MetaMetricsContext);

  const tokenApprovalTextComponent = (
    <span key="fee-card-approve-symbol" className="fee-card__bold">
      {t('enableToken', [tokenApprovalSourceTokenSymbol])}
    </span>
  );

  return (
    <div className="fee-card">
      <div className="fee-card__main">
        <TransactionDetail
          disableEditGasFeeButton
          rows={[
            <TransactionDetailItem
              key="fee-card-gas-item"
              detailTitle={
                <>
                  {t('transactionDetailGasHeading')}
                  <InfoTooltip
                    position="top"
                    contentText={
                      <p className="fee-card__info-tooltip-paragraph">
                        {t('swapGasFeesExplanation', [
                          <ButtonLink
                            size={ButtonLinkSize.Inherit}
                            href={ZENDESK_URLS.GAS_FEES}
                            target="_blank"
                            rel="noopener noreferrer"
                            externalLink
                            key="gas-fees-learn-more"
                            onClick={() => {
                              trackEvent({
                                event: 'Clicked "Gas Fees: Learn More" Link',
                                category: MetaMetricsEventCategory.Swaps,
                              });
                            }}
                          >
                            {t('swapGasFeesExplanationLinkText')}
                          </ButtonLink>,
                        ])}
                      </p>
                    }
                    containerClassName="fee-card__info-tooltip-content-container"
                    wrapperClassName="fee-card__row-label fee-card__info-tooltip-container"
                  />
                </>
              }
              detailText={primaryFee.fee}
              detailTotal={useCurrencyRateCheck && secondaryFee.fee}
              subText={
                (secondaryFee?.maxFee !== undefined ||
                  primaryFee?.maxFee !== undefined) && (
                  <>
                    <Text
                      as="span"
                      fontWeight={FontWeight.Bold}
                      color={TextColor.textAlternative}
                      variant={TextVariant.bodySm}
                    >
                      {t('maxFee')}
                    </Text>
                    {useCurrencyRateCheck
                      ? `: ${secondaryFee.maxFee}`
                      : `: ${primaryFee.maxFee}`}
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
                  {t('swapNQuotesWithDot', [numberOfQuotes])}
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
  hideTokenApprovalRow: PropTypes.bool.isRequired,
  tokenApprovalSourceTokenSymbol: PropTypes.string,
  onTokenApprovalClick: PropTypes.func,
  metaMaskFee: PropTypes.string.isRequired,
  onQuotesClick: PropTypes.func.isRequired,
  numberOfQuotes: PropTypes.number.isRequired,
};
