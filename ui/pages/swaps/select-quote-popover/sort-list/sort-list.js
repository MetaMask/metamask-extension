import React, { useState, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import BigNumber from 'bignumber.js';
import SunCheckIcon from '../../../../components/ui/icon/sun-check-icon.component';
import { I18nContext } from '../../../../contexts/i18n';
import { QUOTE_DATA_ROWS_PROPTYPES_SHAPE } from '../select-quote-popover-constants';
import InfoTooltip from '../../../../components/ui/info-tooltip';
import { getUseCurrencyRateCheck } from '../../../../selectors';

const ToggleArrows = () => (
  <svg
    width="6"
    height="9"
    viewBox="0 0 6 9"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M0.7948 4.96973C0.365112 4.96973 0.150269 5.47754 0.462769 5.77051L2.78699 8.09473C2.96277 8.29004 3.25574 8.29004 3.45105 8.09473L5.77527 5.77051C6.06824 5.47754 5.85339 4.96973 5.44324 4.96973H0.7948ZM5.77527 2.91895L3.45105 0.594727C3.25574 0.418945 2.96277 0.418945 2.78699 0.594727L0.462769 2.91895C0.150269 3.23145 0.365112 3.71973 0.7948 3.71973H5.44324C5.85339 3.71973 6.06824 3.23145 5.77527 2.91895Z"
      fill="var(--color-primary-default)"
    />
  </svg>
);

export default function SortList({
  quoteDataRows,
  selectedAggId,
  onSelect,
  onCaretClick,
  swapToSymbol,
  sortDirection,
  setSortDirection,
  sortColumn = null,
  setSortColumn,
  hideEstimatedGasFee,
}) {
  const t = useContext(I18nContext);
  const [noRowHover, setRowNowHover] = useState(false);
  const useCurrencyRateCheck = useSelector(getUseCurrencyRateCheck);

  const onColumnHeaderClick = (nextSortColumn) => {
    if (nextSortColumn === sortColumn) {
      setSortDirection(sortDirection * -1);
    } else {
      setSortColumn(nextSortColumn);
    }
  };

  // This sort aims to do the following:
  // If there is no selected sort column, then the best quotes should be first in the list
  // If there is no selected sort column, then quotes that are not the best quotes should be in random order, after the first in the list
  // If the sort column is 'quoteSource', sort alphabetically by 'quoteSource'
  // Otherwise, sort in either ascending or descending numerical order on the selected column
  const sortedRows = useMemo(() => {
    return [...quoteDataRows].sort((rowDataA, rowDataB) => {
      if (sortColumn === null && rowDataA.isBestQuote) {
        return -1;
      } else if (sortColumn === null && rowDataB.isBestQuote) {
        return 1;
      } else if (sortColumn === null) {
        // Here, the last character in the destinationTokenValue is used as a source of randomness for sorting
        const aHex = new BigNumber(rowDataA.destinationTokenValue).toString(16);
        const bHex = new BigNumber(rowDataB.destinationTokenValue).toString(16);
        return aHex[aHex.length - 1] < bHex[bHex.length - 1] ? -1 : 1;
      } else if (sortColumn === 'quoteSource') {
        return rowDataA[sortColumn] > rowDataB[sortColumn]
          ? sortDirection * -1
          : sortDirection;
      }
      return new BigNumber(rowDataA[sortColumn]).gt(rowDataB[sortColumn])
        ? sortDirection * -1
        : sortDirection;
    });
  }, [quoteDataRows, sortColumn, sortDirection]);
  const selectedRow = sortedRows.findIndex(
    ({ aggId }) => selectedAggId === aggId,
  );

  return (
    <div className="select-quote-popover__sort-list">
      <div className="select-quote-popover__column-headers">
        <div
          className="select-quote-popover__column-header select-quote-popover__receiving"
          data-testid="select-quote-popover__receiving"
          onClick={() => onColumnHeaderClick('destinationTokenValue')}
        >
          <span className="select-quote-popover__receiving-symbol">
            {swapToSymbol}
          </span>
          <div className="select-quote-popover__receiving-label">
            <span>{t('swapReceiving')}</span>
            <InfoTooltip
              position="bottom"
              contentText={t('swapReceivingInfoTooltip')}
            />
            <ToggleArrows />
          </div>
        </div>
        <div
          className="select-quote-popover__column-header select-quote-popover__network-fees select-quote-popover__network-fees-header"
          data-testid="select-quote-popover__network-fees-header"
          onClick={() => onColumnHeaderClick('rawNetworkFees')}
        >
          {!hideEstimatedGasFee && useCurrencyRateCheck && (
            <>
              <span>{t('swapEstimatedNetworkFees')}</span>
              <InfoTooltip
                position="bottom"
                contentText={t('swapEstimatedNetworkFeesInfo')}
              />
              <ToggleArrows />
            </>
          )}
        </div>
        <div
          className="select-quote-popover__column-header select-quote-popover__quote-source"
          data-testid="select-quote-popover__quote-source"
          onClick={() => onColumnHeaderClick('quoteSource')}
        >
          {t('swapQuoteSource')}
          <div className="select-quote-popover__quote-source-toggle">
            <ToggleArrows />
          </div>
        </div>
      </div>
      {sortedRows.map(
        (
          {
            destinationTokenValue,
            networkFees,
            isBestQuote,
            quoteSource,
            aggId,
          },
          i,
        ) => (
          <div
            className={classnames('select-quote-popover__row', {
              'select-quote-popover__row--selected': selectedRow === i,
              'select-quote-popover__row--no-hover': noRowHover,
            })}
            onClick={() => onSelect(aggId)}
            key={`select-quote-popover-row-${i}`}
            data-testid={`select-quote-popover-row-${i}`}
          >
            <div className="select-quote-popover__receiving">
              <div className="select-quote-popover__receiving-value">
                {isBestQuote && (
                  <SunCheckIcon reverseColors={selectedRow !== i} />
                )}
                <div
                  className="select-quote-popover__receiving-value-text"
                  title={destinationTokenValue}
                >
                  {destinationTokenValue}
                </div>
              </div>
              {quoteSource === 'RFQ' && (
                <span className="select-quote-popover__zero-slippage">
                  {t('swapZeroSlippage')}
                </span>
              )}
            </div>
            <div className="select-quote-popover__network-fees">
              {!hideEstimatedGasFee && useCurrencyRateCheck && networkFees}
            </div>
            <div className="select-quote-popover__quote-source">
              <div
                className={classnames(
                  'select-quote-popover__quote-source-label',
                  {
                    'select-quote-popover__quote-source-label--green':
                      quoteSource === 'AGG',
                    'select-quote-popover__quote-source-label--orange':
                      quoteSource === 'RFQ',
                    'select-quote-popover__quote-source-label--blue':
                      quoteSource === 'DEX',
                  },
                )}
              >
                {quoteSource}
              </div>
            </div>
            <div
              className="select-quote-popover__caret-right"
              data-testid={`select-quote-popover__caret-right-${i}`}
              onClick={(event) => {
                event.stopPropagation();
                onCaretClick(aggId);
              }}
              onMouseEnter={() => setRowNowHover(true)}
              onMouseLeave={() => setRowNowHover(false)}
            >
              <i className="fa fa-angle-up" />
            </div>
          </div>
        ),
      )}
    </div>
  );
}

SortList.propTypes = {
  selectedAggId: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  onCaretClick: PropTypes.func.isRequired,
  swapToSymbol: PropTypes.string.isRequired,
  quoteDataRows: PropTypes.arrayOf(QUOTE_DATA_ROWS_PROPTYPES_SHAPE).isRequired,
  sortDirection: PropTypes.number.isRequired,
  setSortDirection: PropTypes.func.isRequired,
  sortColumn: PropTypes.string,
  setSortColumn: PropTypes.func.isRequired,
  hideEstimatedGasFee: PropTypes.bool.isRequired,
};
