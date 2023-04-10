import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../app/modal';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { hideModal } from '../../../store/actions';
import { getSelectedAddress } from '../../../selectors/selectors';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';
import { Text } from '../../component-library';
import Box from '../../ui/box';
import {
  BLOCK_SIZES,
  BackgroundColor,
  DISPLAY,
  FLEX_WRAP,
  FLEX_DIRECTION,
  BorderRadius,
  FONT_WEIGHT,
  TEXT_ALIGN,
  AlignItems,
} from '../../../helpers/constants/design-system';

const InteractiveReplacementTokenModal = () => {
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const dispatch = useDispatch();

  const { url } = useSelector(
    (state) => state.metamask.interactiveReplacementToken || {},
  );

  const { custodians } = useSelector(
    (state) => state.metamask.mmiConfiguration,
  );
  const address = useSelector(getSelectedAddress);
  const custodyAccountDetails = useSelector(
    (state) =>
      state.metamask.custodyAccountDetails[toChecksumHexAddress(address)],
  );

  const custodianName = custodyAccountDetails?.custodianName;
  const custodian =
    custodians.find((item) => item.name === custodianName) || {};

  const renderCustodyInfo = () => {
    let img;

    if (custodian.iconUrl) {
      img = (
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
          alignItems={AlignItems.center}
          paddingTop={5}
        >
          <Box display={DISPLAY.BLOCK} textAlign={TEXT_ALIGN.CENTER}>
            <img
              src={custodian.iconUrl}
              width={45}
              alt={custodian.displayName}
            />
          </Box>
        </Box>
      );
    } else {
      img = (
        <Box display={DISPLAY.BLOCK} textAlign={TEXT_ALIGN.CENTER}>
          <Text>{custodian.displayName}</Text>
        </Box>
      );
    }

    return (
      <>
        {img}
        <Text
          as="h4"
          paddingTop={4}
          textAlign={TEXT_ALIGN.CENTER}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('custodyRefreshTokenModalTitle')}
        </Text>
        <Text
          as="p"
          paddingTop={4}
          paddingBottom={6}
          textAlign={TEXT_ALIGN.LEFT}
        >
          {t('custodyRefreshTokenModalDescription', [custodian.displayName])}
        </Text>
        <Text as="p" fontWeight={FONT_WEIGHT.MEDIUM}>
          {t('custodyRefreshTokenModalSubtitle')}
        </Text>
        <Text
          as="p"
          paddingTop={4}
          paddingBottom={6}
          textAlign={TEXT_ALIGN.LEFT}
        >
          {t('custodyRefreshTokenModalDescription1')}
        </Text>
        <Text
          as="p"
          marginTop={4}
          paddingTop={4}
          paddingBottom={6}
          textAlign={TEXT_ALIGN.LEFT}
        >
          {t('custodyRefreshTokenModalDescription2')}
        </Text>
      </>
    );
  };

  const handleSubmit = () => {
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

  return (
    <Modal
      onCancel={handleClose}
      onClose={handleClose}
      onSubmit={handleSubmit}
      submitText={custodian.displayName || 'Custodian'}
      cancelText={t('cancel')}
    >
      <Box
        width={BLOCK_SIZES.FULL}
        backgroundColor={BackgroundColor.backgroundDefault}
        display={DISPLAY.FLEX}
        flexWrap={FLEX_WRAP.WRAP}
        flexDirection={FLEX_DIRECTION.COLUMN}
        borderRadius={BorderRadius.SM}
        data-testid="interactive-replacement-token-modal"
      >
        {renderCustodyInfo(custodian)}
      </Box>
    </Modal>
  );
};

export default InteractiveReplacementTokenModal;
