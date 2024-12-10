import React, { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { I18nContext } from '../../../../../contexts/i18n';
import { clearConfirmTransaction } from '../../../../../ducks/confirm-transaction/confirm-transaction.duck';
import { QueueType } from '../../../../../../shared/constants/metametrics';
import { useQueuedConfirmationsEvent } from '../../../hooks/useQueuedConfirmationEvents';
import { useConfirmationNavigation } from '../../../hooks/useConfirmationNavigation';

const ConfirmPageContainerNavigation = () => {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const { id } = useParams();
  const { count, getIndex, navigateToIndex } = useConfirmationNavigation();
  const currentPosition = getIndex(id);

  const totalTx = count;
  const positionOfCurrentTx = currentPosition + 1;
  const showNavigation = count > 1;

  const onNextTx = useCallback(
    (index) => {
      dispatch(clearConfirmTransaction());
      navigateToIndex(index);
    },
    [dispatch, navigateToIndex],
  );

  useQueuedConfirmationsEvent(QueueType.NavigationHeader);

  return (
    <div
      className="confirm-page-container-navigation"
      style={{
        display: showNavigation ? 'flex' : 'none',
      }}
    >
      <div
        className="confirm-page-container-navigation__container"
        data-testid="navigation-container"
        style={{
          visibility: currentPosition > 0 ? 'initial' : 'hidden',
        }}
      >
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="first-page"
          onClick={() => onNextTx(0)}
        >
          <i className="fa fa-angle-double-left fa-2x" />
        </button>
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="previous-page"
          onClick={() => onNextTx(currentPosition - 1)}
        >
          <i className="fa fa-angle-left fa-2x" />
        </button>
      </div>
      <div className="confirm-page-container-navigation__textcontainer">
        <div className="confirm-page-container-navigation__navtext">
          {positionOfCurrentTx} {t('ofTextNofM')} {totalTx}
        </div>
        <div className="confirm-page-container-navigation__longtext">
          {t('requestsAwaitingAcknowledgement')}
        </div>
      </div>
      <div
        className="confirm-page-container-navigation__container"
        style={{
          visibility: currentPosition < count - 1 ? 'initial' : 'hidden',
        }}
      >
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="next-page"
          onClick={() => onNextTx(currentPosition + 1)}
        >
          <i className="fa fa-angle-right fa-2x" />
        </button>
        <button
          className="confirm-page-container-navigation__arrow"
          data-testid="last-page"
          onClick={() => onNextTx(count - 1)}
        >
          <i className="fa fa-angle-double-right fa-2x" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmPageContainerNavigation;
