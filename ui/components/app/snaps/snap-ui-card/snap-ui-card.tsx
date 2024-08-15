import React, { FunctionComponent } from 'react';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Box, Text } from '../../../component-library';
import { SnapUIImage } from '../snap-ui-image';

export type SnapUICardProps = {
  image?: string | undefined;
  title: string;
  description?: string | undefined;
  value: string;
  extra?: string | undefined;
};

export const SnapUICard: FunctionComponent<SnapUICardProps> = ({
  image,
  title,
  description,
  value,
  extra,
}) => {
  return (
    <Box
      className="snap-ui-renderer__card"
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
    >
      <Box display={Display.Flex} gap={4}>
        {image && (
          <SnapUIImage
            width="32px"
            height="32px"
            value={image}
            style={{ borderRadius: '999px' }}
          />
        )}
        <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
          <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
          <Text color={TextColor.textAlternative}>{description}</Text>
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        textAlign={TextAlign.Right}
      >
        <Text variant={TextVariant.bodyMdMedium}>{value}</Text>
        <Text color={TextColor.textAlternative}>{extra}</Text>
      </Box>
    </Box>
  );
};
