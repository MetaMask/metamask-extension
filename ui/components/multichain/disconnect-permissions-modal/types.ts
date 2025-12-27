import {
  PermissionTypesWithCustom,
  Signer,
  StoredGatorPermissionSanitized,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';

export type GatorPermission = {
  permission: StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>;
  chainId: Hex;
  permissionType: string;
};

export type DisconnectPermissionsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSkip: () => void;
  onRemoveAll: () => void;
  permissions?: GatorPermission[];
};

export type PermissionItemProps = {
  permission: GatorPermission;
};
