export type SettingItemProps = {
  isOnboarding?: boolean;
};

export type SettingItemConfig = {
  id: string;
  component: React.ComponentType<SettingItemProps>;
  /** If true, renders a divider line above this item */
  hasDividerBefore?: boolean;
  /** When true, toggle analytics use the Onboarding category */
  isOnboarding?: boolean;
};
