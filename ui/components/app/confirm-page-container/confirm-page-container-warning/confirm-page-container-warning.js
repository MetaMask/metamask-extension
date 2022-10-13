import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Popover from '../../../ui/popover';
import Box from '../../../ui/box';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography';
import {
  DISPLAY,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
  COLORS,
} from '../../../../helpers/constants/design-system';
import Identicon from '../../../ui/identicon';
import { shortenAddress } from '../../../../helpers/utils/util';

const ConfirmPageContainerWarning = ({
  collectionName,
  senderAddress,
  name,
  total,
  onSubmit,
  onCancel,
  showWarningModal,
}) => {
  const t = useI18nContext();

  const footer = (
    <Box
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
      className="confirm-page-container-warning__footer"
    >
      <Button
        className="confirm-page-container-warning__footer__approve-button"
        type="danger-primary"
        onClick={onSubmit}
      >
        {t('approveButtonText')}
      </Button>
      <Button
        className="confirm-page-container-warning__footer__cancel-button"
        type="secondary"
        onClick={onCancel}
      >
        {t('reject')}
      </Button>
    </Box>
  );

  return (
    <Popover
      className="confirm-page-container-warning__content"
      footer={footer}
      open={showWarningModal}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        padding={4}
        className="confirm-page-container-warning__content__header"
      >
        <i className="fa fa-exclamation-triangle confirm-page-container-warning__content__header__warning-icon" />
        <Typography variant={TYPOGRAPHY.H4} fontWeight={FONT_WEIGHT.BOLD}>
          {t('yourNFTmayBeAtRisk')}
        </Typography>
      </Box>
      <Box
        display={DISPLAY.FLEX}
        padding={4}
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
        className="confirm-page-container-warning__content__account"
      >
        <Box display={DISPLAY.FLEX}>
          <Identicon address={senderAddress} diameter={32} />
          <Typography
            variant={TYPOGRAPHY.H5}
            marginLeft={2}
            className="confirm-page-container-warning__content__account-name"
          >
            <b>{name}</b> {` (${shortenAddress(senderAddress)})`}
          </Typography>
        </Box>
        <Typography>{`${t('total')}: ${total}`}</Typography>
      </Box>

      <Typography
        color={COLORS.TEXT_ALTERNATIVE}
        margin={4}
        marginTop={4}
        marginBottom={4}
      >
        {t('nftWarningContent', [
          <strong
            key="non_custodial_bold"
            className="confirm-page-container-warning__content__bold"
          >
            {t('nftWarningContentBold', [collectionName])}
          </strong>,
          <strong key="non_custodial_grey">
            {t('nftWarningContentGrey')}
          </strong>,
        ])}
      </Typography>
    </Popover>
  );
};

ConfirmPageContainerWarning.propTypes = {
  collectionName: PropTypes.string,
  senderAddress: PropTypes.string,
  name: PropTypes.string,
  total: PropTypes.string,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  showWarningModal: PropTypes.bool,
};

export default ConfirmPageContainerWarning;
