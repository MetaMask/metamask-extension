import { endowmentPermissionBuilders } from '@metamask/snap-controllers';
import {
  restrictedMethodPermissionBuilders,
  selectHooks,
} from '@metamask/rpc-methods';
import { ExcludedSnapPermissions } from '../../../../../shared/constants/permissions';

/**
 * @returns {Record<string, Record<string, unknown>>} All endowment permission
 * specifications.
 */
export const buildSnapEndowmentSpecifications = () =>
  Object.values(endowmentPermissionBuilders).reduce(
    (allSpecifications, { targetKey, specificationBuilder }) => {
      allSpecifications[targetKey] = specificationBuilder();
      return allSpecifications;
    },
    {},
  );

/**
 * @param {Record<string, Function>} hooks - The hooks for the Snap
 * restricted method implementations.
 */
export function buildSnapRestrictedMethodSpecifications(hooks) {
  return Object.values(restrictedMethodPermissionBuilders).reduce(
    (specifications, { targetKey, specificationBuilder, methodHooks }) => {
      if (!ExcludedSnapPermissions.has(targetKey)) {
        specifications[targetKey] = specificationBuilder({
          methodHooks: selectHooks(hooks, methodHooks),
        });
      }
      return specifications;
    },
    {},
  );
}
