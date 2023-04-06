import React, { useCallback, useContext } from 'react';
import { useDispatch } from 'react-redux';
import Modal from '../../app/modal';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { hideModal } from '../../../store/actions';
import {
  Text,
  Button,
  BUTTON_TYPES,
  BUTTON_SIZES,
} from '../../component-library';
import Box from '../../ui/box';

// hideModal: PropTypes.func,
// custodian: PropTypes.object,
// url: PropTypes.string

const InteractiveReplacementTokenModal = (props) => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const renderCustodyInfo = () => {
    let img;

    if (custodian.iconUrl) {
      img = (
        <Box className="interactive-replacement-token-modal__img-container">
          <img
            className="interactive-replacement-token-modal__img"
            src={custodian.iconUrl}
            alt={custodian.displayName}
          />
        </Box>
      );
    } else {
      img = (
        <Box className="interactive-replacement-token-modal__img">
          <Text>{custodian.displayName}</Text>
        </Box>
      );
    }

    return (
      <>
        {img}
        <Text as="p" className="interactive-replacement-token-modal__title">
          {t('custodyRefreshTokenModalTitle')}
        </Text>
        <Text
          as="p"
          className="interactive-replacement-token-modal__description"
        >
          {t('custodyRefreshTokenModalDescription', [custodian.displayName])}
        </Text>
        <Text as="p" className="interactive-replacement-token-modal__subtitle">
          {t('custodyRefreshTokenModalSubtitle')}
        </Text>
        <Text
          as="p"
          className="interactive-replacement-token-modal__description"
        >
          {t('custodyRefreshTokenModalDescription1')}
        </Text>
        <Text
          as="p"
          marginTop={4}
          className="interactive-replacement-token-modal__description"
        >
          {t('custodyRefreshTokenModalDescription2')}
        </Text>
      </>
    );
  };

  const handleSubmit = () => {
    const { url } = props;
    global.platform.openTab({
      url,
    });
    trackEvent({
      category: 'MMI',
      event: 'User clicked refresh token link',
    });
  };

  const handleClose = () => {
    dispatch(hideModal());
  };

  const { custodian } = props;

  return (
    <Modal
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText={custodian.displayName || 'Custodian'}
      cancelText={t('cancel')}
      containerClass="compliance-modal-container"
    >
      <Box className="interactive-replacement-token-modal">
        {renderCustodyInfo(custodian)}
      </Box>
    </Modal>
  );
};

export default InteractiveReplacementTokenModal;
