import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import type { MultichainNetworkConfiguration } from '@metamask/multichain-network-controller';
import { toast, ToastContent } from '../../components/ui/toast/toast';
import { REVIEW_PERMISSIONS } from '../../helpers/constants/routes';
import { getURLHost } from '../../helpers/utils/util';
import { getNetworkIcon } from '../../../shared/lib/network.utils';
import { useI18nContext } from '../useI18nContext';

export const permittedNetworkToastId = 'permitted-network-toast';

type ShowPermittedNetworkToastParams = {
  origin: string;
  network: MultichainNetworkConfiguration;
};

export const usePermittedNetworkToast = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

  const showPermittedNetworkToast = useCallback(
    ({ origin, network }: ShowPermittedNetworkToastParams) => {
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
          duration: Infinity,
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
    },
    [navigate, t],
  );

  const dismissPermittedNetworkToast = useCallback(() => {
    toast.dismiss(permittedNetworkToastId);
  }, []);

  return {
    showPermittedNetworkToast,
    dismissPermittedNetworkToast,
  };
};
