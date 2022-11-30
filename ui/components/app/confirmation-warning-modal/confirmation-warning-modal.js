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
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';

const ConfirmationWarningModal = ({ onSubmit, onCancel }) => {
  const t = useI18nContext();

  const footer = (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
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
  );

  return (
    <Popover className="confirmation-warning-modal__content" footer={footer}>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={ALIGN_ITEMS.CENTER}
        padding={4}
        className="confirmation-warning-modal__content__header"
      >
        <i className="fa fa-exclamation-triangle confirmation-warning-modal__content__header__warning-icon" />
        <Typography
          variant={TYPOGRAPHY.H4}
          fontWeight={FONT_WEIGHT.BOLD}
          // align={TEXT_ALIGN.CENTER}
        >
          You are adding a new RPC provider for Ethereum Mainnet
        </Typography>
      </Box>
      <Box marginLeft={6} marginRight={6} marginTop={3} marginBottom={3}>
        <ul>
          <li>
            <Typography variant={TYPOGRAPHY.H6} fontWeight={FONT_WEIGHT.BOLD}>
              Only add this alternative RPC provider if you are certain you can
              trust it.
            </Typography>
          </li>
          <li>
            <Typography marginTop={4} variant={TYPOGRAPHY.H6}>
              A malicious network provider can lie about the state of the
              blockchain and record your network activity.
            </Typography>
          </li>
          <li>
            <Typography marginTop={4} variant={TYPOGRAPHY.H6}>
              The network provider will be able to see and associate your
              accounts together.
            </Typography>
          </li>
          <li>
            <Typography marginTop={4} variant={TYPOGRAPHY.H6}>
              The network provider will be responsible for broadcasting your
              transactions, and their reliability.
            </Typography>
          </li>
          <li>
            <Typography marginTop={4} variant={TYPOGRAPHY.H6}>
              The network provider will be trusted to provide an accurate view
              of account balances and other on-chain state.
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
