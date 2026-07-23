import React from 'react';
import { Box, Text, Icon, IconName } from '../../component-library';
import {
  Display,
  FlexDirection,
  TextVariant,
  TextColor,
  AlignItems,
} from '../../../helpers/constants/design-system';

type FundingMethodItemProps = {
  icon: IconName;
  title: string;
  description: string;
  onClick: () => void;
};

const FundingMethodItem = ({
  icon,
  title,
  description,
  onClick,
}: FundingMethodItemProps) => (
  <Box
    display={[Display.Flex]}
    gap={2}
    alignItems={AlignItems.center}
    onClick={onClick}
    className="funding-method-item"
    padding={4}
  >
    <Icon name={icon} />
    <Box display={[Display.Flex]} flexDirection={FlexDirection.Column}>
      <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
        {description}
      </Text>
    </Box>
  </Box>
);

export default FundingMethodItem;
