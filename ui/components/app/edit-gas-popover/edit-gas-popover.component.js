import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';

import { useDispatch, useSelector } from 'react-redux';
import Popover from '../../ui/popover';
import Button from '../../ui/button';
import EditGasDisplay from '../edit-gas-display';
import EditGasDisplayEducation from '../edit-gas-display-education';

import { I18nContext } from '../../../contexts/i18n';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  hideModal,
  hideSidebar,
  updateTransaction,
} from '../../../store/actions';

export const EDIT_GAS_MODE = {
  SPEED_UP: 'speed-up',
  CANCEL: 'cancel',
  MODIFY_IN_PLACE: 'modify-in-place',
};

export default function EditGasPopover({
  popoverTitle,
  confirmButtonText,
  editGasDisplayProps,
  transaction,
  mode,
  onClose,
}) {
  const t = useContext(I18nContext);
  const dispatch = useDispatch();
  const showSidebar = useSelector((state) => state.appState.sidebar.isOpen);
  const [showEducationContent, setShowEducationContent] = useState(false);

  /**
   * Temporary placeholder, this should be managed by the parent component but
   * we will be extracting this component from the hard to maintain modal/
   * sidebar component. For now this is just to be able to appropriately close
   * the modal in testing
   */
  const closePopover = useCallback(() => {
    if (onClose) {
      onClose();
    } else if (showSidebar) {
      dispatch(hideSidebar());
    } else {
      dispatch(hideModal());
    }
  }, [showSidebar, onClose, dispatch]);

  const onSubmit = useCallback(() => {
    if (!transaction || !mode) {
      closePopover();
    }
    switch (mode) {
      case EDIT_GAS_MODE.CANCEL:
        dispatch(
          createCancelTransaction(transaction.id, {
            /** new gas settings */
          }),
        );
        break;
      case EDIT_GAS_MODE.SPEED_UP:
        dispatch(
          createSpeedUpTransaction(transaction.id, {
            /** new gas settings */
          }),
        );
        break;
      case EDIT_GAS_MODE.MODIFY_IN_PLACE:
        dispatch(
          updateTransaction({
            ...transaction,
            txParams: { ...transaction.txParams /** ...newGasSettings */ },
          }),
        );
        break;
      default:
        break;
    }

    closePopover();
  }, [transaction, mode, dispatch, closePopover]);

  const title = showEducationContent
    ? t('editGasEducationModalTitle')
    : popoverTitle || t('editGasTitle');
  const footerButtonText = confirmButtonText || t('save');

  return (
    <Popover
      title={title}
      onClose={closePopover}
      onBack={
        showEducationContent ? () => setShowEducationContent(false) : undefined
      }
      footer={
        <>
          <Button type="primary" onClick={onSubmit}>
            {footerButtonText}
          </Button>
        </>
      }
    >
      <div style={{ padding: '0 20px 20px 20px' }}>
        {showEducationContent ? (
          <EditGasDisplayEducation />
        ) : (
          <EditGasDisplay
            {...editGasDisplayProps}
            onEducationClick={() => setShowEducationContent(true)}
          />
        )}
      </div>
    </Popover>
  );
}

EditGasPopover.propTypes = {
  popoverTitle: PropTypes.string,
  editGasDisplayProps: PropTypes.object,
  confirmButtonText: PropTypes.string,
  showEducationButton: PropTypes.bool,
  onClose: PropTypes.func,
  transaction: PropTypes.object,
  mode: PropTypes.oneOf(Object.values(EDIT_GAS_MODE)),
};

EditGasPopover.defaultProps = {
  popoverTitle: '',
  editGasDisplayProps: {},
  confirmButtonText: '',
  showEducationButton: false,
};
