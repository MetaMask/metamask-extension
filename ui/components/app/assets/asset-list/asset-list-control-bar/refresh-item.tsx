import React from 'react';
import { Icon, IconName, IconSize } from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { SelectableListItem } from '../sort-control/sort-control';

type RefreshItemProps = {
  onClick: () => void;
};

/**
 * "Refresh list" row used by the token, NFT, and DeFi menus.
 *
 * @param props - The component props.
 * @param props.onClick - Called when the row is chosen.
 */
export const RefreshItem = ({ onClick }: RefreshItemProps) => {
  const t = useI18nContext();

  return (
    <SelectableListItem onClick={onClick} testId="refreshList">
      <Icon name={IconName.Refresh} size={IconSize.Sm} className="mr-2" />
      {t('refreshList')}
    </SelectableListItem>
  );
};
