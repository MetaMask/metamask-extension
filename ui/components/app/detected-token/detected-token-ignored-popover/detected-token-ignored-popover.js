import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Popover from '../../../ui/popover';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';

const DetectedTokenIgnoredPopover = ({
  onCancelIgnore,
  handleClearTokensSelection,
}) => {
  const t = useI18nContext();

  const footer = (
    <>
      <Button
        className="detected-token-ignored-popover__ignore-button"
        type="secondary"
        onClick={onCancelIgnore}
      >
        {t('cancel')}
      </Button>
      <Button
        className="detected-token-ignored-popover__import-button"
        type="primary"
        onClick={handleClearTokensSelection}
      >
        {t('confirm')}
      </Button>
    </>
  );

  return (
    <Popover
      title={t('areYouSure')}
      className="detected-token-ignored-popover"
      footer={footer}
    >
      <Typography
        variant={TYPOGRAPHY.H6}
        tag={TYPOGRAPHY.H6}
        margin={[0, 5, 7, 5]}
      >
        {t('ignoreTokenWarning')}
      </Typography>
    </Popover>
  );
};

DetectedTokenIgnoredPopover.propTypes = {
  onCancelIgnore: PropTypes.func.isRequired,
  handleClearTokensSelection: PropTypes.func.isRequired,
};

export default DetectedTokenIgnoredPopover;
