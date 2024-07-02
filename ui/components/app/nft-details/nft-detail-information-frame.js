import React from 'react';
import PropTypes from 'prop-types';

import { Box, Text } from '../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../helpers/constants/design-system';

const NftDetailInformationFrame = ({
  title,
  value,
  buttonAddressValue,
  frameClassname,
  frameTextTitleProps,
  frameTextTitleStyle,
  frameTextValueStyle,
  frameTextValueProps,
  icon,
}) => {
  return (
    <Box className={`${frameClassname}`}>
      <Text style={frameTextTitleStyle} {...frameTextTitleProps}>
        {title}
      </Text>

      {icon ? (
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.center}
        >
          {' '}
          {buttonAddressValue ? (
            { ...buttonAddressValue }
          ) : (
            <Text style={frameTextValueStyle} {...frameTextValueProps}>
              {value}
            </Text>
          )}
          {icon}
        </Box>
      ) : (
        <Text style={frameTextValueStyle} {...frameTextValueProps}>
          {value}
        </Text>
      )}
    </Box>
  );
};

NftDetailInformationFrame.propTypes = {
  title: PropTypes.string,
  value: PropTypes.string,
  frameClassname: PropTypes.string,
  frameTextTitleProps: PropTypes.object,
  frameTextValueProps: PropTypes.object,
  frameTextTitleStyle: PropTypes.object,
  frameTextValueStyle: PropTypes.object,
  icon: PropTypes.node,
  buttonAddressValue: PropTypes.node,
};

export default NftDetailInformationFrame;
