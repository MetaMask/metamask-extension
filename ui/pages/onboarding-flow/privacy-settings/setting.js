import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import ToggleButton from '../../../components/ui/toggle-button';
import {
  JUSTIFY_CONTENT,
  TYPOGRAPHY,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';

export const Setting = ({ value, setValue, title, description }) => {
  return (
    <Box justifyContent={JUSTIFY_CONTENT.CENTER} margin={3}>
      <div className="privacy-settings__setting">
        <Typography variant={TYPOGRAPHY.H5} fontWeight={FONT_WEIGHT.BOLD}>
          {title}
        </Typography>
        <Typography variant={TYPOGRAPHY.H6}>{description}</Typography>
      </div>
      <div className="privacy-settings__setting__toggle">
        <ToggleButton value={value} onToggle={(val) => setValue(!val)} />
      </div>
    </Box>
  );
};

Setting.propTypes = {
  value: PropTypes.bool,
  setValue: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
};
