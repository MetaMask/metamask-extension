import {
  restrictedMethodPermissionBuilders,
  selectHooks,
} from '@metamask/snaps-rpc-methods';
import { endowmentPermissionBuilders } from '@metamask/snaps-controllers';
import {
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../../shared/constants/permissions';

// TODO: Use the exported versions of these functions from the snaps monorepo after stable release.

/**
 * @returns {Record<string, Record<string, unknown>>} All endowment permission
 * specifications.
 */
export const buildSnapEndowmentSpecifications = () =>
  Object.values(endowmentPermissionBuilders).reduce(
    (allSpecifications, { targetName, specificationBuilder }) => {
      if (!Object.keys(ExcludedSnapEndowments).includes(targetName)) {
        allSpecifications[targetName] = specificationBuilder();
      }
      return allSpecifications;
    },
    {},
  );

/**
 * @param {Record<string, Function>} hooks - The hooks for the Snap
 * restricted method implementations.
 */
export const buildSnapRestrictedMethodSpecifications = (hooks) =>
  Object.values(restrictedMethodPermissionBuilders).reduce(
    (specifications, { targetName, specificationBuilder, methodHooks }) => {
      if (!Object.keys(ExcludedSnapPermissions).includes(targetName)) {
        specifications[targetName] = specificationBuilder({
          methodHooks: selectHooks(hooks, methodHooks),
        });
      }
      return specifications;
    },
    {},
  );
