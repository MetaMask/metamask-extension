export type SettingItemProps = {
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export type SettingItemConfig = {
  id: string;
  component: React.FC<SettingItemProps>;
  /** If true, renders a divider line above this item */
  hasDividerBefore?: boolean;
};
