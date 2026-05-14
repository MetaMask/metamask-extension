import React, { FunctionComponent, ReactNode } from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { Text } from '../../../component-library';
import { SnapUIImage } from '../snap-ui-image';

export type SnapUICardProps = {
  image?: string | undefined;
  title: string | ReactNode;
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
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Between}
      alignItems={BoxAlignItems.Center}
      gap={2}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        gap={4}
        alignItems={BoxAlignItems.Center}
        style={{ overflow: 'hidden' }}
      >
        {image && (
          <SnapUIImage
            width="32px"
            height="32px"
            value={image}
            borderRadius="999px"
          />
        )}
        <Box
          flexDirection={BoxFlexDirection.Column}
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
        flexDirection={BoxFlexDirection.Column}
        className="text-right"
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
