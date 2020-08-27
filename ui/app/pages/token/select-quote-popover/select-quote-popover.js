import React, { useState, useCallback, useContext } from 'react'
import PropTypes from 'prop-types'
import { I18nContext } from '../../../contexts/i18n'
import Popover from '../../../components/ui/popover'
import Button from '../../../components/ui/button'
import QuoteDetails from './quote-details'
import SortList from './sort-list'
import { QUOTE_DATA_ROWS_PROPTYPES_SHAPE } from './select-quote-popover-constants'

const SelectQuotePopover = ({
  quoteDataRows = [],
  onClose = null,
  onSubmit = null,
  convertToSymbol,
}) => {
  const t = useContext(I18nContext)

  const [sortDirection, setSortDirection] = useState(1)
  const [sortColumn, setSortColumn] = useState('destinationTokenValue')

  const [selectedAggId, setSelectedAggId] = useState(() => quoteDataRows.find(({ isBestQuote }) => isBestQuote).aggId)
  const [contentView, setContentView] = useState('sortList')
  const [viewingAggId, setViewingAggId] = useState(() => quoteDataRows.find(({ isBestQuote }) => isBestQuote).aggId)

  const selectedQuoteDataRow = quoteDataRows.find(({ aggId }) => aggId === viewingAggId)

  const onSubmitClick = useCallback(() => {
    onSubmit(selectedAggId)
    onClose()
  }, [selectedAggId, onClose, onSubmit])

  const closeQuoteDetails = useCallback(() => setContentView('sortList'), [])

  const onRowClick = useCallback((aggId) => setSelectedAggId(aggId), [setSelectedAggId])

  const onCaretClick = useCallback((aggId) => {
    setContentView('quoteDetails')
    setViewingAggId(aggId)
  }, [])

  const CustomBackground = useCallback(() => (<div className="select-quote-popover__popover-bg" onClick={onClose} />), [onClose])
  const footer = (
    <>
      <Button
        type="default"
        className="page-container__footer-button select-quote-popover__button"
        onClick={onClose}
      >
        { t('close') }
      </Button>

      <Button
        type="confirm"
        className="page-container__footer-button select-quote-popover__button"
        onClick={onSubmitClick}
      >
        { t('swapSelect') }
      </Button>
    </>
  )

  return (
    <div className="select-quote-popover">
      <Popover
        title={contentView === 'quoteDetails' ? t('swapSelectAQuote') : t('swapQuoteDetails')}
        subtitle={contentView === 'sortList' && t('swapSelectQuotePopoverDescription')}
        onClose={onClose}
        CustomBackground={CustomBackground}
        className="select-quote-popover__popover-wrap"
        footerClassName="token__footer"
        footer={contentView !== 'quoteDetails' && footer}
        onBack={contentView === 'quoteDetails' ? closeQuoteDetails : null}
      >
        {contentView === 'sortList' && (
          <SortList
            quoteDataRows={quoteDataRows}
            selectedAggId={selectedAggId}
            onSelect={onRowClick}
            onCaretClick={onCaretClick}
            convertToSymbol={convertToSymbol}
            sortDirection={sortDirection}
            setSortDirection={setSortDirection}
            sortColumn={sortColumn}
            setSortColumn={setSortColumn}
          />
        )}
        {contentView === 'quoteDetails' && (
          <QuoteDetails
            {...selectedQuoteDataRow}
          />
        )}
      </Popover>
    </div>
  )
}

SelectQuotePopover.propTypes = {
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  convertToSymbol: PropTypes.string,
  renderableData: PropTypes.array,
  quoteDataRows: PropTypes.arrayOf(QUOTE_DATA_ROWS_PROPTYPES_SHAPE),
}

export default SelectQuotePopover
