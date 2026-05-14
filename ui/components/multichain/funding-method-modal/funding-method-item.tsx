import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { Text, Icon, IconName } from '../../component-library';
import {
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';

type FundingMethodItemProps = {
  icon: IconName;
  title: string;
  description: string;
  onClick: () => void;
};

const FundingMethodItem: React.FC<FundingMethodItemProps> = ({
  icon,
  title,
  description,
  onClick,
}) => (
  <Box
    flexDirection={BoxFlexDirection.Row}
    gap={2}
    alignItems={BoxAlignItems.Center}
    onClick={onClick}
    className="funding-method-item"
    padding={4}
  >
    <Icon name={icon} />
    <Box flexDirection={BoxFlexDirection.Column}>
      <Text variant={TextVariant.bodyMdMedium}>{title}</Text>
      <Text variant={TextVariant.bodySm} color={TextColor.textAlternative}>
        {description}
      </Text>
    </Box>
  </Box>
);

export default FundingMethodItem;
