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
import { ScopeObject, ScopeParamsObject } from './scope';

export const Caip25CaveatType = 'authorizedScopes';

export const Caip25CaveatFactoryFn = ({
  requiredScopes,
  optionalScopes,
  sessionProperties,
}: ScopeParamsObject) => {
  return {
    type: Caip25CaveatType,
    value: { requiredScopes, optionalScopes, sessionProperties },
  };
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


const reduceKeysHelper = (acc, [key, value]) => {
  return {
    ...acc,
    [key]: value,
  };
};

/**
 * Removes the target account from the value arrays of all
 * `endowment:caip25` caveats. No-ops if the target scopeString is not in
 * the existing scopes,.
 *
 * @param {string} targetScopeString - The address of the account to remove from
 * all accounts permissions.
 * @param {ScopeParamsObject} existingScopeParams - The account address array from the
 * account permissions.
 */
function removeScope(targetScopeString, existingScopes) {
  const newRequiredScopes = Object.entries(
    existingScopes.requiredScopes,
  ).filter((scope) => scope !== targetScopeString);
  const newOptionalScopes = Object.entries(
    existingScopes.optionalScopes,
  ).filter((scope) => scope !== targetScopeString);

  const requiredScopesRemoved =
    newRequiredScopes.length !== existingScopes.requiredScopes.length;
  const optionalScopesRemoved =
    newOptionalScopes.length !== existingScopes.optionalScopes.length;

  if (requiredScopesRemoved) {
    return {
      operation: CaveatMutatorOperation.revokePermission,
    };
  }

  if (!requiredScopesRemoved && optionalScopesRemoved) {
    return {
      operation: CaveatMutatorOperation.updateValue,
      value: {
        requiredScopes: newRequiredScopes.reduce(reduceKeysHelper),
        optionalScopes: newOptionalScopes.reduce(reduceKeysHelper),
      },
    };
  }

  if (!requiredScopesRemoved && !optionalScopesRemoved) {
    return {
      operation: CaveatMutatorOperation.noop,
      value: existingScopes,
    };
  }
}
