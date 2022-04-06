import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import Popover from '../../../ui/popover';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../../helpers/constants/routes';

const DetectedTokenIgnoredPopover = ({ handleClearTokensSelection }) => {
  const t = useI18nContext();
  const history = useHistory();
  const footer = (
    <>
      <Button
        className="detected-token-popover__ignore-button"
        type="secondary"
        // onClick={onIgnoreAll}
      >
        {t('cancel')}
      </Button>
      <Button
        className="detected-token-popover__import-button"
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
      onClose={() => history.push(DEFAULT_ROUTE)}
      footer={footer}
    >
      <Typography variant={TYPOGRAPHY.H5}>{t('ignoreTokenWarning')}</Typography>
    </Popover>
  );
};

DetectedTokenIgnoredPopover.propTypes = {
  handleClearTokensSelection: PropTypes.func.isRequired,
};

export default DetectedTokenIgnoredPopover;
