import PropTypes from 'prop-types';
import React from 'react';
import {
  DISPLAY,
  FLEX_DIRECTION,
  FontWeight,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { Text } from '../../../component-library';
import Box from '../../../ui/box/box';
import Modal from '../../modal';

const ConfirmClearContactList = ({ clearContactList, hideModal }) => {
  const bodyText =
    'All your contact list will be deleted. You may want to cancel and backup your contact list first.';
  return (
    <Modal
      onSubmit={() => {
        clearContactList();
        hideModal();
      }}
      submitText="Clear contact list"
      onCancel={() => hideModal()}
      cancelText="Cancel"
      submitType="danger-primary"
    >
      <Box
        display={DISPLAY.FLEX}
        justifyContent={JustifyContent.center}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Box as="header">
          <Text
            as="h1"
            variant={TextVariant.headingMd}
            fontWeight={FontWeight.Bold}
            textAlign={TextAlign.Center}
          >
            Are you sure you want to delete your contact list?
          </Text>
        </Box>
        <Box marginTop={4}>
          <Text
            as="h3"
            variant={TextVariant.bodyMd}
            fontWeight={FontWeight.Normal}
          >
            {bodyText}
          </Text>
        </Box>
      </Box>
    </Modal>
  );
};

ConfirmClearContactList.propTypes = {
  hideModal: PropTypes.func.isRequired,
  clearContactList: PropTypes.func,
};

export default withModalProps(ConfirmClearContactList);
