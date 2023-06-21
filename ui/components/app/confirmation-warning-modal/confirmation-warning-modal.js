import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Popover from '../../ui/popover';
import Box from '../../ui/box';
import Button from '../../ui/button';
import {
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextVariant,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';
import { Icon, IconName, IconSize, Text } from '../../component-library';

const ConfirmationWarningModal = ({ onSubmit, onCancel }) => {
  const t = useI18nContext();

  return (
    <Popover
      className="confirmation-warning-modal__content"
      footer={
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.spaceBetween}
          className="confirmation-warning-modal__footer"
        >
          <Button
            className="confirmation-warning-modal__footer__approve-button"
            type="danger-primary"
            onClick={onSubmit}
          >
            {t('approveButtonText')}
          </Button>
          <Button
            className="confirmation-warning-modal__footer__cancel-button"
            type="secondary"
            onClick={onCancel}
          >
            {t('reject')}
          </Button>
        </Box>
      }
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        padding={3}
        margin={0}
        className="confirmation-warning-modal__content__header"
      >
        <Icon
          name={IconName.Danger}
          color={IconColor.errorDefault}
          className="confirmation-warning-modal__content__header__warning-icon"
          size={IconSize.Xl}
        />
        <Text
          variant={TextVariant.headingSm}
          as="h4"
          fontWeight={FontWeight.Bold}
        >
          {t('addEthereumChainWarningModalTitle')}
        </Text>
      </Box>
      <Box marginLeft={6} marginRight={6} marginTop={0} marginBottom={3}>
        <Text marginTop={4} variant={TextVariant.bodySm} as="h6">
          {t('addEthereumChainWarningModalHeader', [
            <strong key="part-2">
              {t('addEthereumChainWarningModalHeaderPartTwo')}
            </strong>,
          ])}
        </Text>
        <Text marginTop={4} variant={TextVariant.bodySm} as="h6">
          {t('addEthereumChainWarningModalListHeader')}
        </Text>
        <ul>
          <li>
            <Text marginTop={2} variant={TextVariant.bodySm} as="h6">
              {t('addEthereumChainWarningModalListPointOne')}
            </Text>
          </li>
          <li>
            <Text marginTop={2} variant={TextVariant.bodySm} as="h6">
              {t('addEthereumChainWarningModalListPointTwo')}
            </Text>
          </li>
          <li>
            <Text marginTop={2} variant={TextVariant.bodySm} as="h6">
              {t('addEthereumChainWarningModalListPointThree')}
            </Text>
          </li>
        </ul>
      </Box>
    </Popover>
  );
};

ConfirmationWarningModal.propTypes = {
  /**
   * Function that approves collection
   */
  onSubmit: PropTypes.func,
  /**
   * Function that rejects collection
   */
  onCancel: PropTypes.func,
};

export default ConfirmationWarningModal;
