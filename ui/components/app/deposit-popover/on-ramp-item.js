import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../ui/button';
import Box from '../../ui/box';
import Typography from '../../ui/typography';
import { COLORS, FRACTIONS } from '../../../helpers/constants/design-system';

const OnRampItem = ({
  logo,
  title,
  text,
  buttonLabel,
  onButtonClick,
  hide = false,
}) => {
  if (hide) {
    return null;
  }
  return (
    <Box paddingRight={6} paddingLeft={6}>
      <Box
        paddingTop={6}
        paddingBottom={6}
        style={{
          borderBottomSize: '1px',
          borderBottomColor: COLORS.BORDER_MUTED,
        }}
      >
        <Box width={FRACTIONS.HALF}>{logo}</Box>
        <Typography
          variant="h6"
          fontWeight="bold"
          boxProps={{
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          {title}
        </Typography>
        <Typography
          boxProps={{
            paddingTop: 2,
            paddingBottom: 2,
          }}
        >
          {text}
        </Typography>
        <Box marginTop={4}>
          <Button type="secondary" onClick={onButtonClick}>
            {buttonLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

OnRampItem.propTypes = {
  logo: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  buttonLabel: PropTypes.string.isRequired,
  onButtonClick: PropTypes.func.isRequired,
  hide: PropTypes.bool,
};

export default OnRampItem;
