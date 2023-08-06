import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import {
  Display,
  JustifyContent,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import {
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  Button,
  BUTTON_VARIANT,
  Box,
  BUTTON_SIZES,
} from '../../../component-library';

const DetectedTokenIgnoredPopover = ({
  partiallyIgnoreDetectedTokens,
  onCancelIgnore,
  handleClearTokensSelection,
}) => {
  const t = useI18nContext();

  const footer = (
    <>
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        marginLeft={4}
        marginRight={4}
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
    </>
  );

  return (
    // <Popover
    //   title={
    //     partiallyIgnoreDetectedTokens
    //       ? t('importSelectedTokens')
    //       : t('areYouSure')
    //   }
    //   className={classNames('detected-token-ignored-popover', {
    //     'detected-token-ignored-popover--import': partiallyIgnoreDetectedTokens,
    //     'detected-token-ignored-popover--ignore':
    //       !partiallyIgnoreDetectedTokens,
    //   })}
    //   footer={footer}
    // >
    //   <Text
    //     variant={TextVariant.bodySm}
    //     as="h6"
    //     marginTop={0}
    //     marginRight={5}
    //     marginBottom={7}
    //     marginLeft={5}
    //   >
    //     {partiallyIgnoreDetectedTokens
    //       ? t('importSelectedTokensDescription')
    //       : t('ignoreTokenWarning')}
    //   </Text>
    // </Popover>

    <Modal
      isOpen
      className={classNames('detected-token-ignored-popover', {
        'detected-token-ignored-popover--import': partiallyIgnoreDetectedTokens,
        'detected-token-ignored-popover--ignore':
          !partiallyIgnoreDetectedTokens,
      })}
      onClose={onCancelIgnore}
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onCancelIgnore} marginBottom={4}>
          {partiallyIgnoreDetectedTokens
            ? t('importSelectedTokens')
            : t('areYouSure')}
        </ModalHeader>
        <Text
          variant={TextVariant.bodySm}
          as="h6"
          marginTop={0}
          marginRight={5}
          marginBottom={7}
          marginLeft={5}
        >
          {partiallyIgnoreDetectedTokens
            ? t('importSelectedTokensDescription')
            : t('ignoreTokenWarning')}
        </Text>

        {footer}
      </ModalContent>
    </Modal>
  );
};

DetectedTokenIgnoredPopover.propTypes = {
  partiallyIgnoreDetectedTokens: PropTypes.bool.isRequired,
  onCancelIgnore: PropTypes.func.isRequired,
  handleClearTokensSelection: PropTypes.func.isRequired,
};

export default DetectedTokenIgnoredPopover;
