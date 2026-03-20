export type SettingItemProps = {
  sectionRef?: React.RefObject<HTMLDivElement>;
};

export type SettingItemConfig = {
  id: string;
  /** i18n key for the item title — used for search indexing */
  titleKey: string;
  component: React.FC<SettingItemProps>;
  /** If true, renders a divider line above this item */
  hasDividerBefore?: boolean;
};
