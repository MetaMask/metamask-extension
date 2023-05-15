import { endowmentPermissionBuilders } from '@metamask/snaps-controllers';
import {
  restrictedMethodPermissionBuilders,
  selectHooks,
} from '@metamask/rpc-methods';
import {
  ExcludedSnapEndowments,
  ExcludedSnapPermissions,
} from '../../../../../shared/constants/permissions';
import { nameLookupEndowmentBuilder } from './name-lookup';

/**
 * @returns {Record<string, Record<string, unknown>>} All endowment permission
 * specifications.
 */
export const buildSnapEndowmentSpecifications = () =>
  Object.values({
    ...endowmentPermissionBuilders,
    'endowment:name-lookup': nameLookupEndowmentBuilder,
  }).reduce((allSpecifications, { targetKey, specificationBuilder }) => {
    if (!Object.keys(ExcludedSnapEndowments).includes(targetKey)) {
      allSpecifications[targetKey] = specificationBuilder();
    }
    return allSpecifications;
  }, {});

/**
 * @param {Record<string, Function>} hooks - The hooks for the Snap
 * restricted method implementations.
 */
export const buildSnapRestrictedMethodSpecifications = (hooks) =>
  Object.values(restrictedMethodPermissionBuilders).reduce(
    (specifications, { targetKey, specificationBuilder, methodHooks }) => {
      if (!Object.keys(ExcludedSnapPermissions).includes(targetKey)) {
        specifications[targetKey] = specificationBuilder({
          methodHooks: selectHooks(hooks, methodHooks),
        });
      }
      return specifications;
    },
    {},
  );
