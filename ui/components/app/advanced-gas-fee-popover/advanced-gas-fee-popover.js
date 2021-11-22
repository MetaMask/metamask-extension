import React from 'react';
import PropTypes from 'prop-types';
import Popover from '../../ui/popover';
import Box from '../../ui/box';
import Button from '../../ui/button';
import I18nValue from '../../ui/i18n-value';
import { useI18nContext } from '../../../hooks/useI18nContext';

const AdvancedGasFeePopover = ({ onClose }) => {
  const t = useI18nContext();

  return (
    <Popover
      className="advanced-gas-fee-popover"
      title={t('advancedGasFeeModalTitle')}
      onBack={() => onClose()}
      onClose={() => onClose()}
      footer={
        <Button type="primary">
          <I18nValue messageKey="save" />
        </Button>
      }
    >
      <Box className="advanced-gas-fee-popover" margin={4}></Box>
    </Popover>
  );
};

AdvancedGasFeePopover.propTypes = {
  onClose: PropTypes.func,
};

export default AdvancedGasFeePopover;
