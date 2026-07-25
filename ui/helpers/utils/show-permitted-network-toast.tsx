import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import type { NavigateFunction } from 'react-router-dom';
import { toast, ToastContent } from '../../components/ui/toast/toast';
import { useI18nContext } from '../../hooks/useI18nContext';
import { REVIEW_PERMISSIONS } from '../constants/routes';
import { getNetworkIcon } from '../../../shared/lib/network.utils';
import { getURLHost } from './util';

export const permittedNetworkToastId = 'permitted-network-toast';

type TranslateFn = ReturnType<typeof useI18nContext>;

type ShowPermittedNetworkToastParams = {
  origin: string;
  network: MultichainNetworkConfiguration;
  t: TranslateFn;
  navigate: NavigateFunction;
};

export function showPermittedNetworkToast({
  origin,
  network,
  t,
  navigate,
}: ShowPermittedNetworkToastParams) {
  const networkName = network.name;

  toast.success(
    <ToastContent
      title={t('permittedChainToastUpdate', [
        getURLHost(origin),
        networkName,
      ])}
      actionText={t('editPermissions')}
      onActionClick={() => {
        toast.dismiss(permittedNetworkToastId);
        navigate(
          `${REVIEW_PERMISSIONS}?origin=${encodeURIComponent(origin)}`,
        );
      }}
      dataTestId={permittedNetworkToastId}
    />,
    {
      id: permittedNetworkToastId,
      icon: (
        <AvatarNetwork
          size={AvatarNetworkSize.Md}
          className="border-transparent"
          src={getNetworkIcon(network)}
          name={networkName || getURLHost(origin)}
        />
      ),
    },
  );
}

export function dismissPermittedNetworkToast() {
  toast.dismiss(permittedNetworkToastId);
}
