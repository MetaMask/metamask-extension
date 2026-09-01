export type SettingItemProps = Record<string, never>;

export type SettingItemConfig = {
  id: string;
  component: React.ComponentType<SettingItemProps>;
  /** If true, renders a divider line above this item */
  hasDividerBefore?: boolean;
};
