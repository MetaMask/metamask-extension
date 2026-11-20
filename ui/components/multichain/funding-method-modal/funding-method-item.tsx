import React from 'react';
import {
  ContentVariant,
  Icon,
  IconName,
  IconSize,
  ListItem,
} from '@metamask/design-system-react';

type FundingMethodItemProps = {
  icon: IconName;
  iconSize?: IconSize;
  title: string;
  description: string;
  onClick: () => void;
};

const FundingMethodItem = ({
  icon,
  iconSize = IconSize.Md,
  title,
  description,
  onClick,
}: FundingMethodItemProps) => (
  <ListItem
    variant={ContentVariant.TwoLines}
    isInteractive
    onClick={onClick}
    className="funding-method-item"
    avatar={
      <span className="flex h-6 w-6 shrink-0 items-center justify-center">
        <Icon name={icon} size={iconSize} />
      </span>
    }
    title={title}
    description={description}
  />
);

export default FundingMethodItem;
