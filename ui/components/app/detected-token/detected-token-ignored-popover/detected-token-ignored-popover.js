import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import {
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import {
  Text,
  Modal,
  ModalOverlay,
  Button,
  BUTTON_VARIANT,
  Box,
  BUTTON_SIZES,
} from '../../../component-library';
import { ModalContent } from '../../../component-library/modal-content/deprecated';
import { ModalHeader } from '../../../component-library/modal-header/deprecated';

const DetectedTokenIgnoredPopover = ({
  partiallyIgnoreDetectedTokens,
  onCancelIgnore,
  handleClearTokensSelection,
  isOpen,
}) => {
  const t = useI18nContext();
  return (
    <Modal
      isOpen={isOpen}
      className={classNames('detected-token-ignored-popover', {
        'detected-token-ignored-popover--import': partiallyIgnoreDetectedTokens,
        'detected-token-ignored-popover--ignore':
          !partiallyIgnoreDetectedTokens,
      })}
      onClose={onCancelIgnore}
      autoFocus={false}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader marginBottom={4}>
          {partiallyIgnoreDetectedTokens
            ? t('importSelectedTokens')
            : t('areYouSure')}
        </ModalHeader>
        <Text marginBottom={4}>
          {partiallyIgnoreDetectedTokens
            ? t('importSelectedTokensDescription')
            : t('ignoreTokenWarning')}
        </Text>
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          gap={4}
        >
          <Button
            className="detected-token-ignored-popover__ignore-button"
            block
            variant={BUTTON_VARIANT.SECONDARY}
            onClick={onCancelIgnore}
            size={BUTTON_SIZES.LG}
          >
            {t('cancel')}
          </Button>
          <Button
            className="detected-token-ignored-popover__import-button"
            block
            variant={BUTTON_VARIANT.PRIMARY}
            onClick={handleClearTokensSelection}
            size={BUTTON_SIZES.LG}
          >
            {t('confirm')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
};

DetectedTokenIgnoredPopover.propTypes = {
  partiallyIgnoreDetectedTokens: PropTypes.bool.isRequired,
  onCancelIgnore: PropTypes.func.isRequired,
  handleClearTokensSelection: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
};

export default DetectedTokenIgnoredPopover;
