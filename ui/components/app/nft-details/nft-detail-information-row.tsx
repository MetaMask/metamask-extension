import React from 'react';

import { Box, Text } from '../../component-library';
import {
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

type NftDetailInformationRowProps = {
  title: string;
  valueColor?: TextColor;
  value?: string;
  icon?: React.ReactNode;
  buttonAddressValue?: React.ReactNode[];
};

const NftDetailInformationRow = ({
  title,
  valueColor,
  value,
  icon,
  buttonAddressValue,
}: NftDetailInformationRowProps) => {
  if (!value && !buttonAddressValue) {
    return null;
  }
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={2}
    >
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
      >
        {title}
      </Text>
      {icon ? (
        <Box display={Display.Flex}>
          {buttonAddressValue ? (
            { ...buttonAddressValue }
          ) : (
            <Text
              color={valueColor || TextColor.textAlternative}
              variant={TextVariant.bodyMdMedium}
            >
              {value}
            </Text>
          )}
          {icon}
        </Box>
      ) : (
        <Text
          color={valueColor || TextColor.textAlternative}
          variant={TextVariant.bodyMdMedium}
        >
          {value}
        </Text>
      )}
    </Box>
  );
};

export default NftDetailInformationRow;
