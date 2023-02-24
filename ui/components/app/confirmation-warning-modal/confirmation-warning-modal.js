import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';

import Popover from '../../ui/popover';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography';
import {
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JustifyContent,
  TypographyVariant,
  AlignItems,
  IconColor,
} from '../../../helpers/constants/design-system';
import { Icon, ICON_NAMES, ICON_SIZES } from '../../component-library';

const ConfirmationWarningModal = ({ onSubmit, onCancel }) => {
  const t = useI18nContext();

  return (
    <Popover
      className="confirmation-warning-modal__content"
      footer={
        <Box
          display={DISPLAY.FLEX}
          flexDirection={FLEX_DIRECTION.COLUMN}
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
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.center}
        padding={3}
        margin={0}
        className="confirmation-warning-modal__content__header"
      >
        <Icon
          name={ICON_NAMES.DANGER}
          color={IconColor.errorDefault}
          className="confirmation-warning-modal__content__header__warning-icon"
          size={ICON_SIZES.XL}
        />
        <Typography
          variant={TypographyVariant.H4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('addEthereumChainWarningModalTitle')}
        </Typography>
      </Box>
      <Box marginLeft={6} marginRight={6} marginTop={0} marginBottom={3}>
        <Typography marginTop={4} variant={TypographyVariant.H6}>
          {t('addEthereumChainWarningModalHeader', [
            <strong key="part-2">
              {t('addEthereumChainWarningModalHeaderPartTwo')}
            </strong>,
          ])}
        </Typography>
        <Typography marginTop={4} variant={TypographyVariant.H6}>
          {t('addEthereumChainWarningModalListHeader')}
        </Typography>
        <ul>
          <li>
            <Typography marginTop={2} variant={TypographyVariant.H6}>
              {t('addEthereumChainWarningModalListPointOne')}
            </Typography>
          </li>
          <li>
            <Typography marginTop={2} variant={TypographyVariant.H6}>
              {t('addEthereumChainWarningModalListPointTwo')}
            </Typography>
          </li>
          <li>
            <Typography marginTop={2} variant={TypographyVariant.H6}>
              {t('addEthereumChainWarningModalListPointThree')}
            </Typography>
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
