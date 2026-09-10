import React from 'react';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { Box, Text } from '../../component-library';
import {
  Display,
  FlexDirection,
  TextVariant,
  TextColor,
  AlignItems,
} from '../../../helpers/constants/design-system';

type FundingMethodItemProps = {
  icon: IconName;
  iconSize: IconSize;
  title: string;
  description: string;
  onClick: () => void;
};

const FundingMethodItem = ({
  icon,
  iconSize,
  title,
  description,
  onClick,
}: FundingMethodItemProps) => (
  <Box
    display={[Display.Flex]}
    gap={3}
    alignItems={AlignItems.center}
    onClick={onClick}
    className="funding-method-item"
    padding={4}
  >
    <span className="funding-method-item__icon">
      <Icon name={icon} size={iconSize} />
    </span>
    <Box display={[Display.Flex]} flexDirection={FlexDirection.Column}>
      <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
        {description}
      </Text>
    </Box>
  </Box>
);

export default FundingMethodItem;
