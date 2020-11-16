import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import BigNumber from 'bignumber.js'
import classnames from 'classnames'
import { I18nContext } from '../../../contexts/i18n'
import { calcTokenAmount } from '../../../helpers/utils/token-util'
import { toPrecisionWithoutTrailingZeros } from '../../../helpers/utils/util'
import Tooltip from '../../../components/ui/tooltip'
import SunCheckIcon from '../../../components/ui/icon/sun-check-icon.component'
import ExchangeRateDisplay from '../exchange-rate-display'
import { formatSwapsValueForDisplay } from '../swaps.util'
import QuoteBackdrop from './quote-backdrop'

function getFontSizes(fontSizeScore) {
  if (fontSizeScore <= 11) {
    return [40, 32]
  }
  if (fontSizeScore <= 16) {
    return [30, 24]
  }
  return [24, 14]
}

function getLineHeight(fontSizeScore) {
  if (fontSizeScore <= 11) {
    return 32
  }
  if (fontSizeScore <= 16) {
    return 26
  }
  return 18
}

// Returns a numerical value based on the length of the two passed strings: amount and symbol.
// The returned value equals the number of digits in the amount string plus a value calculated
// from the length of the symbol string. The returned number will be passed to the getFontSizes function
// to determine the font size to apply to the amount and symbol strings when rendered. The
// desired maximum digits and letters to show in the ultimately rendered string is 20, and in
// such cases there can also be ellipsis shown and a decimal, combinding for a rendered "string"
// length of ~22. As the symbol will always have a smaller font size than the amount, the
// additive value of the symbol length to the font size score is corrected based on the total
// number of alphanumeric characters in both strings and the desired rendered length of 22.
function getFontSizeScore(amount, symbol) {
  const amountLength = amount.match(/\d+/gu).join('').length
  const symbolModifier = Math.min((amountLength + symbol.length) / 22, 1)
  return amountLength + symbol.length * symbolModifier
}

export default function MainQuoteSummary({
  isBestQuote,
  sourceValue,
  sourceSymbol,
  sourceDecimals,
  destinationValue,
  destinationSymbol,
  destinationDecimals,
}) {
  const t = useContext(I18nContext)

  const sourceAmount = toPrecisionWithoutTrailingZeros(
    calcTokenAmount(sourceValue, sourceDecimals).toString(10),
    12,
  )
  const destinationAmount = calcTokenAmount(
    destinationValue,
    destinationDecimals,
  )

  const amountToDisplay = formatSwapsValueForDisplay(destinationAmount)
  const fontSizeScore = getFontSizeScore(amountToDisplay, destinationSymbol)
  const [numberFontSize, symbolFontSize] = getFontSizes(fontSizeScore)
  const lineHeight = getLineHeight(fontSizeScore)

  let ellipsedAmountToDisplay = amountToDisplay
  if (fontSizeScore > 20) {
    ellipsedAmountToDisplay = `${amountToDisplay.slice(
      0,
      amountToDisplay.length - (fontSizeScore - 20),
    )}...`
  }

  return (
    <div className="main-quote-summary">
      <div
        className={classnames('main-quote-summary__quote-backdrop', {
          'main-quote-summary__quote-backdrop-with-top-tab': isBestQuote,
        })}
      >
        <QuoteBackdrop withTopTab={isBestQuote} />
      </div>
      <div className="main-quote-summary__best-quote">
        {isBestQuote && <SunCheckIcon />}
        <span>{isBestQuote && t('swapsBestQuote')}</span>
      </div>
      <div className="main-quote-summary__details">
        <div className="main-quote-summary__quote-details-top">
          <span className="main-quote-summary__quote-small-white">
            {t('swapsConvertToAbout', [
              <span
                className="main-quote-summary__bold"
                key="main-quote-summary-bold-1"
              >
                {`${sourceAmount} ${sourceSymbol}`}
              </span>,
            ])}
          </span>
          <div className="main-quote-summary__quote-large">
            <Tooltip
              interactive
              position="bottom"
              html={amountToDisplay}
              disabled={ellipsedAmountToDisplay === amountToDisplay}
              theme="white"
            >
              <span
                className="main-quote-summary__quote-large-number"
                style={{
                  fontSize: numberFontSize,
                  lineHeight: `${lineHeight}px`,
                }}
              >
                {`${ellipsedAmountToDisplay}`}
              </span>
            </Tooltip>
            <span
              className="main-quote-summary__quote-large-symbol"
              style={{
                fontSize: symbolFontSize,
                lineHeight: `${lineHeight}px`,
              }}
            >
              {`${destinationSymbol}`}
            </span>
          </div>
        </div>
        <div className="main-quote-summary__exchange-rate-container">
          <ExchangeRateDisplay
            primaryTokenValue={sourceValue}
            primaryTokenDecimals={sourceDecimals}
            primaryTokenSymbol={sourceSymbol}
            secondaryTokenValue={destinationValue}
            secondaryTokenDecimals={destinationDecimals}
            secondaryTokenSymbol={destinationSymbol}
            className="exchange-rate-display--white"
            arrowColor="white"
          />
        </div>
      </div>
    </div>
  )
}

MainQuoteSummary.propTypes = {
  isBestQuote: PropTypes.bool,
  sourceValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  sourceDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  sourceSymbol: PropTypes.string.isRequired,
  destinationValue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(BigNumber),
  ]).isRequired,
  destinationDecimals: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  destinationSymbol: PropTypes.string.isRequired,
}
