import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import { toast, ToastContent } from '../../components/ui/toast/toast';
import { getURLHost } from './util';

export const permittedNetworkToastId = 'permitted-network-toast';

type ShowPermittedNetworkToastParams = {
  origin: string;
  networkName: string;
  networkImageUrl?: string;
  title: string;
  editPermissionsLabel: string;
  onEditPermissions: () => void;
};

export function showPermittedNetworkToast({
  origin,
  networkName,
  networkImageUrl,
  title,
  editPermissionsLabel,
  onEditPermissions,
}: ShowPermittedNetworkToastParams) {
  toast.success(
    <ToastContent
      title={title}
      actionText={editPermissionsLabel}
      onActionClick={() => {
        toast.dismiss(permittedNetworkToastId);
        onEditPermissions();
      }}
      dataTestId={permittedNetworkToastId}
    />,
    {
      id: permittedNetworkToastId,
      icon: (
        <AvatarNetwork
          size={AvatarNetworkSize.Md}
          className="border-transparent"
          src={networkImageUrl}
          name={networkName || getURLHost(origin)}
        />
      ),
    },
  );
}

export function dismissPermittedNetworkToast() {
  toast.dismiss(permittedNetworkToastId);
}
