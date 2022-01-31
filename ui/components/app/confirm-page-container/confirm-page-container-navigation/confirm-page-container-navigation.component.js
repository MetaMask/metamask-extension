import React from 'react';
import PropTypes from 'prop-types';

const ConfirmPageContainerNavigation = (props) => {
  const {
    onNextTx,
    totalTx,
    positionOfCurrentTx,
    nextTxId,
    prevTxId,
    showNavigation,
    firstTx,
    lastTx,
    ofText,
    requestsWaitingText,
  } = props;

  return (
    <div
      className="confirm-page-container-navigation"
      style={{
        display: showNavigation ? 'flex' : 'none',
      }}
    >
      <div
        className="confirm-page-container-navigation__container"
        style={{
          visibility: prevTxId ? 'initial' : 'hidden',
        }}
      >
        <div
          className="confirm-page-container-navigation__arrow"
          data-testid="first-page"
          onClick={() => onNextTx(firstTx)}
        >
          <img src="./images/double-arrow.svg" alt="" />
        </div>
        <div
          className="confirm-page-container-navigation__arrow"
          data-testid="previous-page"
          onClick={() => onNextTx(prevTxId)}
        >
          <img src="./images/single-arrow.svg" alt="" />
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
        }}
      >
        <div
          className="confirm-page-container-navigation__arrow"
          data-testid="next-page"
          onClick={() => onNextTx(nextTxId)}
        >
          <img
            className="confirm-page-container-navigation__imageflip"
            src="./images/single-arrow.svg"
            alt=""
          />
        </div>
        <div
          className="confirm-page-container-navigation__arrow"
          data-testid="last-page"
          onClick={() => onNextTx(lastTx)}
        >
          <img
            className="confirm-page-container-navigation__imageflip"
            src="./images/double-arrow.svg"
            alt=""
          />
        </div>
      </div>
    </div>
  );
};

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
};

export default ConfirmPageContainerNavigation;
