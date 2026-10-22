import React from 'react';
import {
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';

export type SideNavItemProps = {
  isActive: boolean;
  icon: IconName;
  label: string;
  onClick: () => void;
  'data-testid'?: string;
};

export const SideNavItem = ({
  isActive,
  icon,
  label,
  onClick,
  'data-testid': testId,
}: SideNavItemProps) => {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`group/item flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-background-default-hover ${
        isActive ? 'bg-background-muted' : ''
      }`}
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      <Icon
        name={icon}
        size={IconSize.Lg}
        color={isActive ? IconColor.IconDefault : IconColor.IconAlternative}
        className="transition-colors duration-200 group-hover/item:text-icon-default-hover"
      />
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextDefault}
      >
        {label}
      </Text>
    </button>
  );
};
