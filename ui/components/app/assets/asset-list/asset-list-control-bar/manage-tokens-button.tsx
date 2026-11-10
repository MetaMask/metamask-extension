import React from 'react';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import Tooltip from '../../../../ui/tooltip';
import { assetControlIconButtonClassName } from './asset-controls';
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
        className={assetControlIconButtonClassName}
        onClick={openTokenManagement}
        size={ButtonIconSize.Sm}
        iconName={IconName.MoreVertical}
        ariaLabel={t('manageTokens')}
      />
    </Tooltip>
  );
};
