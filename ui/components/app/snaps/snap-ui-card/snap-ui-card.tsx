import React, { FunctionComponent } from 'react';
import {
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
  AlignItems,
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
      alignItems={AlignItems.center}
    >
      <Box display={Display.Flex} gap={4} alignItems={AlignItems.center}>
        {image && (
          <SnapUIImage
            width="32px"
            height="32px"
            value={image}
            style={{ borderRadius: '999px' }}
          />
        )}
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          style={{ overflow: 'hidden' }}
        >
          <Text variant={TextVariant.bodyMdMedium} ellipsis>
            {title}
          </Text>
          {description && (
            <Text color={TextColor.textAlternative} ellipsis>
              {description}
            </Text>
          )}
        </Box>
      </Box>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        textAlign={TextAlign.Right}
        style={{ overflow: 'hidden' }}
      >
        <Text variant={TextVariant.bodyMdMedium} ellipsis>
          {value}
        </Text>
        {extra && (
          <Text color={TextColor.textAlternative} ellipsis>
            {extra}
          </Text>
        )}
      </Box>
    </Box>
  );
};
