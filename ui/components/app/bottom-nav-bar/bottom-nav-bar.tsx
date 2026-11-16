import React from 'react';
import {
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextVariant,
  TextColor,
  FontWeight,
} from '@metamask/design-system-react';
import { useMainNavItems } from '../../../hooks/useMainNavItems';

type NavTabProps = {
  isActive: boolean;
  icon: IconName;
  label: string;
  onClick: () => void;
  'data-testid'?: string;
};

const NavTab = ({
  isActive,
  icon,
  label,
  onClick,
  'data-testid': testId,
}: NavTabProps) => {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className="group/tab flex flex-1 flex-col gap-1 items-center justify-center"
      aria-current={isActive ? 'page' : undefined}
      aria-label={label}
    >
      <Icon
        name={icon}
        size={IconSize.Lg}
        color={isActive ? IconColor.IconDefault : IconColor.IconAlternative}
        className="transition-colors duration-200 group-hover/tab:text-icon-default-hover"
      />
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        color={isActive ? TextColor.TextDefault : TextColor.TextAlternative}
        className="transition-colors duration-200 group-hover/tab:text-text-default"
      >
        {label}
      </Text>
    </button>
  );
};

export function BottomNavBar() {
  const items = useMainNavItems();

  return (
    <nav
      data-testid="parent-selector-bottom-nav-bar"
      className="bottom-nav-bar sticky bottom-0 mt-auto w-full shrink-0 bg-background-default border-t border-[color:var(--bar-border-color)] flex flex-row justify-between p-2 gap-2 z-[100] transition-[background-color,backdrop-filter] duration-200"
      style={{ viewTransitionName: 'bottom-nav-bar' }}
    >
      {items.map(({ id, icon, label, isActive, onClick }) => (
        <NavTab
          key={id}
          isActive={isActive}
          icon={icon}
          label={label}
          onClick={onClick}
          data-testid={`bottom-nav-${id}`}
        />
      ))}
    </nav>
  );
}
