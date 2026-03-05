export type SettingItemConfig = {
  id: string;
  component: React.FC;
  /** If true, renders a divider line above this item */
  hasDividerBefore?: boolean;
};
