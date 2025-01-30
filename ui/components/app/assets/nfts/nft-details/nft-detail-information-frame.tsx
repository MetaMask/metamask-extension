import React from 'react';

import { Box, Text } from '../../../../component-library';
import {
  AlignItems,
  Display,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';

type NftDetailInformationFrameProps = {
  title?: string;
  value?: string;
  frameClassname: string;
  frameTextTitleProps: Record<string, unknown>;
  frameTextValueProps?: Record<string, unknown>;
  frameTextTitleStyle?: React.CSSProperties;
  frameTextValueStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  buttonAddressValue?: React.ButtonHTMLAttributes<HTMLButtonElement>;
};

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
}: NftDetailInformationFrameProps) => {
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

export default NftDetailInformationFrame;
