import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Button from '../../ui/button';
import Box from '../../ui/box';
import Typography from '../../ui/typography';
import {
  ALIGN_ITEMS,
  DISPLAY,
  FLEX_WRAP,
  BLOCK_SIZES,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

const OnRampItem = ({
  className,
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
    <Box
      className={classnames('deposit-popover__on-ramp-item', className)}
      as="li"
      marginRight={6}
      marginLeft={6}
    >
      <Box
        paddingTop={6}
        paddingBottom={6}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        flexWrap={FLEX_WRAP.WRAP}
      >
        <Box
          width={[BLOCK_SIZES.HALF, BLOCK_SIZES.HALF, BLOCK_SIZES.ONE_FIFTH]}
          display={DISPLAY.FLEX}
          justifyContent={[
            JUSTIFY_CONTENT.FLEX_START,
            JUSTIFY_CONTENT.FLEX_START,
            JUSTIFY_CONTENT.CENTER,
          ]}
          paddingLeft={[0, 0, 4]}
          paddingRight={[0, 0, 4]}
          paddingBottom={[2, 0]}
        >
          {logo}
        </Box>
        <Box
          width={[BLOCK_SIZES.FULL, BLOCK_SIZES.FULL, BLOCK_SIZES.TWO_FIFTHS]}
          paddingLeft={[0, 0, 4]}
          paddingRight={[0, 0, 4]}
          paddingBottom={[2, 0]}
        >
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          <Typography>{text}</Typography>
        </Box>
        <Box
          paddingLeft={[0, 0, 4]}
          paddingRight={[0, 0, 4]}
          width={[BLOCK_SIZES.FULL, BLOCK_SIZES.FULL, BLOCK_SIZES.TWO_FIFTHS]}
          paddingBottom={[2, 0]}
        >
          <Button type="secondary" onClick={onButtonClick}>
            {buttonLabel}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

OnRampItem.propTypes = {
  className: PropTypes.string,
  logo: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  buttonLabel: PropTypes.string.isRequired,
  onButtonClick: PropTypes.func.isRequired,
  hide: PropTypes.bool,
};

export default OnRampItem;
