import React from 'react'
import PropTypes from 'prop-types'

const ConfirmPageContainerNavigation = (props) => {
  const { onNextTx, totalTx, positionOfCurrentTx, nextTxId, prevTxId, showNavigation, firstTx, lastTx, ofText, requestsWaitingText } = props

  return (
    <div className="confirm-page-container-navigation"
      style={{
        display: showNavigation ? 'flex' : 'none',
      }}
    >
      <div className="confirm-page-container-navigation__container"
        style={{
          visibility: prevTxId ? 'initial' : 'hidden',
        }}>
        <div
          className="confirm-page-container-navigation__arrow"
<<<<<<< HEAD
          onClick={() => onNextTx(firstTx)}>
=======
          data-testid="first-page"
          onClick={() => onNextTx(firstTx)}
        >
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
          <img src="/images/double-arrow.svg" />
        </div>
        <div
          className="confirm-page-container-navigation__arrow"
<<<<<<< HEAD
          onClick={() => onNextTx(prevTxId)}>
=======
          data-testid="previous-page"
          onClick={() => onNextTx(prevTxId)}
        >
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
          <img src="/images/single-arrow.svg" />
        </div>
      </div>
      <div className="confirm-page-container-navigation__textcontainer">
        <div className="confirm-page-container-navigation__navtext">
          {positionOfCurrentTx} {ofText} {totalTx}
        </div>
        <div className="confirm-page-container-navigation__longtext">
          {requestsWaitingText}
        </div>
      </div>
      <div
        className="confirm-page-container-navigation__container"
        style={{
          visibility: nextTxId ? 'initial' : 'hidden',
        }}>
        <div
          className="confirm-page-container-navigation__arrow"
<<<<<<< HEAD
          onClick={() => onNextTx(nextTxId)}>
=======
          data-testid="next-page"
          onClick={() => onNextTx(nextTxId)}
        >
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
          <img className="confirm-page-container-navigation__imageflip" src="/images/single-arrow.svg" />
        </div>
        <div
          className="confirm-page-container-navigation__arrow"
<<<<<<< HEAD
          onClick={() => onNextTx(lastTx)}>
=======
          data-testid="last-page"
          onClick={() => onNextTx(lastTx)}
        >
>>>>>>> eebc504b0f23d7c7b725e111a89665a2ac7d50dc
          <img className="confirm-page-container-navigation__imageflip" src="/images/double-arrow.svg" />
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
  requestsWaitingText: PropTypes.string,
}

export default ConfirmPageContainerNavigation
