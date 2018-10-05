import React from 'react'
import PropTypes from 'prop-types'

const ConfirmPageContainerNavigation = props => {
  const { onNextTx, totalTx, positionOfCurrentTx, nextTxId, prevTxId, showNavigation, firstTx, lastTx, ofText } = props

  return (
    <div className="confirm-page-container-navigation"
        style={{
          visibility: showNavigation ? 'initial' : 'hidden',
        }}
    >
      <div className="confirm-page-container-navigation__container"
        style={{
          visibility: prevTxId ? 'initial' : 'hidden',
        }}>
        <div
          className="confirm-page-container-navigation__arrow"
          onClick={() => onNextTx(firstTx)}>
          {'<'}
        </div>
        <div
          className="confirm-page-container-navigation__arrow"
          onClick={() => onNextTx(prevTxId)}>
          ◄
        </div>
      </div>
      <div>
        {positionOfCurrentTx} {ofText} {totalTx}
      </div>
      <div
        className="confirm-page-container-navigation__container"
        style={{
          visibility: nextTxId ? 'initial' : 'hidden',
        }}>
        <div
          className="confirm-page-container-navigation__arrow"
          onClick={() => onNextTx(nextTxId)}>
          ►
        </div>
        <div
          className="confirm-page-container-navigation__arrow"
          onClick={() => onNextTx(lastTx)}>
          {'>'}
        </div>
      </div>
    </div>
  )
}

ConfirmPageContainerNavigation.propTypes = {
  totalTx: PropTypes.number,
  positionOfCurrentTx: PropTypes.number,
  onNextTx: PropTypes.func,
  nextTxId: PropTypes.string,
  prevTxId: PropTypes.string,
  showNavigation: PropTypes.bool,
  firstTx: PropTypes.string,
  lastTx: PropTypes.string,
  ofText: PropTypes.string,
}

export default ConfirmPageContainerNavigation
