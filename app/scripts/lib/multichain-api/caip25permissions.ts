import type {
  PermissionSpecificationBuilder,
  EndowmentGetterParams,
  ValidPermissionSpecification,
  PermissionValidatorConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
import { CaveatMutatorOperation } from '@metamask/permission-controller';
import { PermissionType, SubjectType } from '@metamask/permission-controller';
import type { NonEmptyArray } from '@metamask/utils';

export const Caip25CaveatType = 'authorizedScopes';

export const Caip25CaveatFactoryFn = ({
  requiredScopes,
  optionalScopes,
}: any) => {
  return { type: Caip25CaveatType, value: { requiredScopes, optionalScopes } };
};

export const Caip25EndowmentPermissionName = 'endowment:caip25';

type Caip25EndowmentSpecification = ValidPermissionSpecification<{
  permissionType: PermissionType.Endowment;
  targetName: typeof Caip25EndowmentPermissionName;
  endowmentGetter: (_options?: EndowmentGetterParams) => null;
  validator: PermissionValidatorConstraint;
  allowedCaveats: Readonly<NonEmptyArray<string>> | null;
}>;

/**
 * `endowment:caip25` returns nothing atm;
 *
 * @param _builderOptions - Optional specification builder options.
 * @returns The specification for the `caip25` endowment.
 */
const specificationBuilder: PermissionSpecificationBuilder<
  PermissionType.Endowment,
  any,
  Caip25EndowmentSpecification
> = (_builderOptions?: unknown) => {
  return {
    permissionType: PermissionType.Endowment,
    targetName: Caip25EndowmentPermissionName,
    allowedCaveats: [Caip25CaveatType],
    endowmentGetter: (_getterOptions?: EndowmentGetterParams) => null,
    subjectTypes: [SubjectType.Website],
    validator: (permission: PermissionConstraint) => {
      const caip25Caveat = permission.caveats?.[0];
      if (
        permission.caveats?.length !== 1 ||
        caip25Caveat?.type !== Caip25CaveatType
      ) {
        throw new Error('missing required caveat'); // throw better error here
      }

    },
  };
};

export const caip25EndowmentBuilder = Object.freeze({
  targetName: Caip25EndowmentPermissionName,
  specificationBuilder,
} as const);



/**
 * Factories that construct caveat mutator functions that are passed to
 * PermissionController.updatePermissionsByCaveat.
 */
export const Caip25CaveatMutatorFactories = {
  [Caip25CaveatType]: {
    removeScope,
  },
};

/**
 * Removes the target account from the value arrays of all
 * `restrictReturnedAccounts` caveats. No-ops if the target account is not in
 * the array, and revokes the parent permission if it's the only account in
 * the array.
 *
 * @param {string} targetScopeString - The address of the account to remove from
 * all accounts permissions.
 * @param {CaipNamespace[]} existingScopes - The account address array from the
 * account permissions.
 */
function removeScope(targetScopeString, existingScopes) {
  const newScopes = Object.entries(existingScopes).filter(
    ([scopeString, scope]) => scopeString !== targetScopeString,
  ).reduce((acc, [scopeString, scope]) => {
    acc[scopeString] = scope;
    return acc;
  }, {});

  if (Object.entries(newScopes).length === Object.entries(existingScopes).length) {
    return { operation: CaveatMutatorOperation.noop };
  } else if (Object.entries(newScopes).length > 0) {
    return {
      operation: CaveatMutatorOperation.updateValue,
      value: newScopes,
    };
  }
  return { operation: CaveatMutatorOperation.revokePermission };
}
