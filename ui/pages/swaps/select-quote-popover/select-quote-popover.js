import React, { useState, useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';
import Popover from '../../../components/ui/popover';
import Button from '../../../components/ui/button';
import QuoteDetails from './quote-details';
import SortList from './sort-list';
import { QUOTE_DATA_ROWS_PROPTYPES_SHAPE } from './select-quote-popover-constants';

const SelectQuotePopover = ({
  quoteDataRows = [],
  onClose = null,
  onSubmit = null,
  swapToSymbol,
  initialAggId,
  onQuoteDetailsIsOpened,
  hideEstimatedGasFee,
}) => {
  const t = useContext(I18nContext);

  const [sortDirection, setSortDirection] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);

  const [selectedAggId, setSelectedAggId] = useState(initialAggId);
  const [contentView, setContentView] = useState('sortList');
  const [viewingAgg, setViewingAgg] = useState(null);

  const onSubmitClick = useCallback(() => {
    onSubmit(selectedAggId);
    onClose();
  }, [selectedAggId, onClose, onSubmit]);

  const closeQuoteDetails = useCallback(() => {
    setViewingAgg(null);
    setContentView('sortList');
  }, []);

  const onRowClick = useCallback(
    (aggId) => setSelectedAggId(aggId),
    [setSelectedAggId],
  );

  const onCaretClick = useCallback(
    (aggId) => {
      const agg = quoteDataRows.find((quote) => quote.aggId === aggId);
      setContentView('quoteDetails');
      onQuoteDetailsIsOpened();
      setViewingAgg(agg);
    },
    [quoteDataRows, onQuoteDetailsIsOpened],
  );

  const CustomBackground = useCallback(
    () => (
      <div className="select-quote-popover__popover-bg" onClick={onClose} />
    ),
    [onClose],
  );
  const footer = (
    <>
      <Button
        type="secondary"
        className="page-container__footer-button select-quote-popover__button"
        onClick={onClose}
      >
        {t('close')}
      </Button>

      <Button
        type="primary"
        className="page-container__footer-button select-quote-popover__button"
        onClick={onSubmitClick}
      >
        {t('swapSelect')}
      </Button>
    </>
  );

  return (
    <div className="select-quote-popover">
      <Popover
        title={
          contentView === 'quoteDetails'
            ? t('swapSelectAQuote')
            : t('swapQuoteDetails')
        }
        subtitle={
          contentView === 'sortList'
            ? t('swapSelectQuotePopoverDescription')
            : null
        }
        onClose={onClose}
        CustomBackground={CustomBackground}
        className="select-quote-popover__popover-wrap"
        footerClassName="swaps__footer"
        footer={contentView === 'quoteDetails' ? null : footer}
        onBack={contentView === 'quoteDetails' ? closeQuoteDetails : null}
      >
        {contentView === 'sortList' && (
          <SortList
            quoteDataRows={quoteDataRows}
            selectedAggId={selectedAggId}
            onSelect={onRowClick}
            onCaretClick={onCaretClick}
            swapToSymbol={swapToSymbol}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            sortColumn={sortColumn}
            setSortColumn={setSortColumn}
            hideEstimatedGasFee={hideEstimatedGasFee}
          />
        )}
        {contentView === 'quoteDetails' && viewingAgg && (
          <QuoteDetails
            {...viewingAgg}
            hideEstimatedGasFee={hideEstimatedGasFee}
          />
        )}
      </Popover>
    </div>
  );
};

SelectQuotePopover.propTypes = {
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  swapToSymbol: PropTypes.string,
  quoteDataRows: PropTypes.arrayOf(QUOTE_DATA_ROWS_PROPTYPES_SHAPE),
  initialAggId: PropTypes.string,
  onQuoteDetailsIsOpened: PropTypes.func,
  hideEstimatedGasFee: PropTypes.bool.isRequired,
};

export default SelectQuotePopover;
