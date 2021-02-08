import { restrictedMethodBuilders, selectHooks } from '@metamask/rpc-methods';

/**
 * @typedef {Object} SnapPermissionSpecificationHooks
 * @property {Function} addSnap
 * @property {Function} clearSnapState
 * @property {Function} getMnemonic
 * @property {Function} getSnap
 * @property {Function} getSnapRpcHandler
 * @property {Function} getSnapState
 * @property {Function} showConfirmation
 * @property {Function} updateSnapState
 */

/**
 * @param {SnapPermissionSpecificationHooks} hooks - The hooks for the Snap
 * restricted method implementations.
 */
export function buildSnapPermissionSpecifications(hooks) {
  return Object.values(restrictedMethodBuilders).reduce(
    (specifications, { targetKey, specificationBuilder, methodHooks }) => {
      specifications[targetKey] = specificationBuilder({
        methodHooks: selectHooks(hooks, methodHooks),
      });
      return specifications;
    },
    {},
  );
}
