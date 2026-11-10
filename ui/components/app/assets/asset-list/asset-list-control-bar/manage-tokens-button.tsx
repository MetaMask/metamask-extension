import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import Tooltip from '../../../../ui/tooltip';
import { useOpenTokenManagement } from './use-open-token-management';

/**
 * More button that opens token management directly. Used when the account has
 * no token or NFT options menu.
 */
export const ManageTokensButton = () => {
  const t = useI18nContext();
  const openTokenManagement = useOpenTokenManagement();

  return (
    <Tooltip title={t('manageTokens')} position="bottom" distance={20}>
      <ButtonIcon
        data-testid="importTokens-button"
        className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-transparent hover:bg-hover active:bg-pressed"
        onClick={openTokenManagement}
        size={ButtonIconSize.Sm}
        iconName={IconName.MoreVertical}
        ariaLabel={t('manageTokens')}
      />
    </Tooltip>
  );
};
