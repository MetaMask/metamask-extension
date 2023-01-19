import React, { useContext } from 'react';
import { useParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { I18nContext } from '../../../contexts/i18n';

export default function Navigation({
  enumUnapprovedTxsOrUnconfirmedMessages,
  onNext,
}) {
  const t = useContext(I18nContext);
  const { id } = useParams();

  const currentPosition = enumUnapprovedTxsOrUnconfirmedMessages.indexOf(id);
  const totalTx = enumUnapprovedTxsOrUnconfirmedMessages.length;
  const positionOfCurrentTx = currentPosition + 1;
  const nextTxId = enumUnapprovedTxsOrUnconfirmedMessages[currentPosition + 1];
  const prevTxId = enumUnapprovedTxsOrUnconfirmedMessages[currentPosition - 1];
  const showNavigation = enumUnapprovedTxsOrUnconfirmedMessages.length > 1;
  const firstTx = enumUnapprovedTxsOrUnconfirmedMessages[0];
  const lastTx =
    enumUnapprovedTxsOrUnconfirmedMessages[
      enumUnapprovedTxsOrUnconfirmedMessages.length - 1
    ];

  return (
    <div
      className="navigation"
      style={{
        display: showNavigation ? 'flex' : 'none',
      }}
    >
      <div
        className="navigation__container"
        data-testid="navigation-container"
        style={{
          visibility: prevTxId ? 'initial' : 'hidden',
        }}
      >
        <button
          className="navigation__arrow"
          data-testid="first-page"
          onClick={() => onNext(firstTx)}
        >
          <i className="fa fa-angle-double-left fa-2x" />
        </button>
        <button
          className="navigation__arrow"
          data-testid="previous-page"
          onClick={() => onNext(prevTxId)}
        >
          <i className="fa fa-angle-left fa-2x" />
        </button>
      </div>
      <div className="navigation__textcontainer">
        <div className="navigation__navtext">
          {positionOfCurrentTx} {t('ofTextNofM')} {totalTx}
        </div>
        <div className="navigation__longtext">
          {t('requestsAwaitingAcknowledgement')}
        </div>
      </div>
      <div
        className="navigation__container"
        style={{
          visibility: nextTxId ? 'initial' : 'hidden',
        }}
      >
        <button
          className="navigation__arrow"
          data-testid="next-page"
          onClick={() => onNext(nextTxId)}
        >
          <i className="fa fa-angle-right fa-2x" />
        </button>
        <button
          className="navigation__arrow"
          data-testid="last-page"
          onClick={() => onNext(lastTx)}
        >
          <i className="fa fa-angle-double-right fa-2x" />
        </button>
      </div>
    </div>
  );
}

Navigation.propTypes = {
  /**
   * Returns the names of the enumerable string properties and methods of an object.
   */
  enumUnapprovedTxsOrUnconfirmedMessages: PropTypes.array.isRequired,
  /**
   * The onNext handler to be passed to the Navigation component.
   */
  onNext: PropTypes.func.isRequired,
};
