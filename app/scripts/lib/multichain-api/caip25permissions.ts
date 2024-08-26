import { strict as assert } from 'assert';
import type {
  PermissionSpecificationBuilder,
  EndowmentGetterParams,
  ValidPermissionSpecification,
  PermissionValidatorConstraint,
  PermissionConstraint,
  Caveat,
} from '@metamask/permission-controller';
import {
  CaveatMutatorOperation,
  PermissionType,
  SubjectType,
} from '@metamask/permission-controller';
import {
  CaipAccountId,
  Json,
  parseCaipAccountId,
  type Hex,
  type NonEmptyArray,
} from '@metamask/utils';
import { NetworkClientId } from '@metamask/network-controller';
import { cloneDeep, isEqual } from 'lodash';
import {
  Scope,
  validateAndFlattenScopes,
  ScopesObject,
  ScopeObject,
} from './scope';
import { assertScopesSupported } from './scope/assert';

export type Caip25CaveatValue = {
  requiredScopes: ScopesObject;
  optionalScopes: ScopesObject;
  sessionProperties?: Record<string, Json>;
  isMultichainOrigin: boolean;
};

export const Caip25CaveatType = 'authorizedScopes';

export const Caip25CaveatFactoryFn = (value: Caip25CaveatValue) => {
  return {
    type: Caip25CaveatType,
    value,
  };
};

export const Caip25EndowmentPermissionName = 'endowment:caip25';

type Caip25EndowmentMethodHooks = {
  findNetworkClientIdByChainId: (chainId: Hex) => NetworkClientId;
};

type Caip25EndowmentSpecification = ValidPermissionSpecification<{
  permissionType: PermissionType.Endowment;
  targetName: typeof Caip25EndowmentPermissionName;
  endowmentGetter: (_options?: EndowmentGetterParams) => null;
  validator: PermissionValidatorConstraint;
  allowedCaveats: Readonly<NonEmptyArray<string>> | null;
}>;

type Caip25EndowmentSpecificationBuilderOptions = {
  methodHooks: Caip25EndowmentMethodHooks;
};

/**
 * `endowment:caip25` returns nothing atm;
 *
 * @param builderOptions - The specification builder options.
 * @param builderOptions.methodHooks
 * @param builderOptions.methodHooks.findNetworkClientIdByChainId
 * @returns The specification for the `caip25` endowment.
 */
const specificationBuilder: PermissionSpecificationBuilder<
  PermissionType.Endowment,
  Caip25EndowmentSpecificationBuilderOptions,
  Caip25EndowmentSpecification
> = ({
  methodHooks: { findNetworkClientIdByChainId },
}: Caip25EndowmentSpecificationBuilderOptions) => {
  return {
    permissionType: PermissionType.Endowment,
    targetName: Caip25EndowmentPermissionName,
    allowedCaveats: [Caip25CaveatType],
    endowmentGetter: (_getterOptions?: EndowmentGetterParams) => null,
    subjectTypes: [SubjectType.Website],
    validator: (permission: PermissionConstraint) => {
      const caip25Caveat = permission.caveats?.[0] as Caveat<
        typeof Caip25CaveatType,
        Caip25CaveatValue
      >;
      if (
        permission.caveats?.length !== 1 ||
        caip25Caveat?.type !== Caip25CaveatType
      ) {
        throw new Error('missing required caveat'); // TODO: throw better error here
      }

      const { requiredScopes, optionalScopes, isMultichainOrigin } =
        caip25Caveat.value;

      if (
        !requiredScopes ||
        !optionalScopes ||
        typeof isMultichainOrigin !== 'boolean'
      ) {
        throw new Error('missing expected caveat values'); // TODO: throw better error here
      }

      const { flattenedRequiredScopes, flattenedOptionalScopes } =
        validateAndFlattenScopes(requiredScopes, optionalScopes);

      const isChainIdSupported = (chainId: Hex) => {
        try {
          findNetworkClientIdByChainId(chainId);
          return true;
        } catch (err) {
          return false;
        }
      };

      assertScopesSupported(flattenedRequiredScopes, {
        isChainIdSupported,
      });
      assertScopesSupported(flattenedOptionalScopes, {
        isChainIdSupported,
      });

      assert.deepEqual(requiredScopes, flattenedRequiredScopes);
      assert.deepEqual(optionalScopes, flattenedOptionalScopes);
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
    removeAccount,
  },
};

const reduceKeysHelper = <K extends string, V>(
  acc: Record<K, V>,
  [key, value]: [K, V],
) => {
  return {
    ...acc,
    [key]: value,
  };
};

function removeAccountFilterFn(targetAddress: string) {
  return (account: CaipAccountId) => {
    const parsed = parseCaipAccountId(account);
    return parsed.address !== targetAddress;
  };
}

function removeAccountOnScope(targetAddress: string, scopeObject: ScopeObject) {
  if (scopeObject.accounts) {
    scopeObject.accounts = scopeObject.accounts.filter(
      removeAccountFilterFn(targetAddress),
    );
  }
}

function removeAccount(
  targetAddress: string, // non caip-10 formatted address
  existingScopes: Caip25CaveatValue,
) {
  // copy existing scopes
  const copyOfExistingScopes = cloneDeep(existingScopes);

  [
    copyOfExistingScopes.requiredScopes,
    copyOfExistingScopes.optionalScopes,
  ].forEach((scopes) => {
    Object.entries(scopes).forEach(([, scopeObject]) => {
      removeAccountOnScope(targetAddress, scopeObject);
    });
  });

  // deep equal check for changes
  const noChange = isEqual(copyOfExistingScopes, existingScopes);

  if (noChange) {
    return {
      operation: CaveatMutatorOperation.noop,
    };
  }

  return {
    operation: CaveatMutatorOperation.updateValue,
    value: copyOfExistingScopes,
  };
}

/**
 * Removes the target account from the value arrays of all
 * `endowment:caip25` caveats. No-ops if the target scopeString is not in
 * the existing scopes,.
 *
 * @param targetScopeString - TODO
 * @param existingScopes - TODO
 */
export function removeScope(
  targetScopeString: Scope,
  existingScopes: Caip25CaveatValue,
) {
  const newRequiredScopes = Object.entries(
    existingScopes.requiredScopes,
  ).filter(([scope]) => scope !== targetScopeString);
  const newOptionalScopes = Object.entries(
    existingScopes.optionalScopes,
  ).filter(([scope]) => {
    return scope !== targetScopeString;
  });

  const requiredScopesRemoved =
    newRequiredScopes.length !==
    Object.keys(existingScopes.requiredScopes).length;
  const optionalScopesRemoved =
    newOptionalScopes.length !==
    Object.keys(existingScopes.optionalScopes).length;

  if (requiredScopesRemoved) {
    return {
      operation: CaveatMutatorOperation.revokePermission,
    };
  }

  if (optionalScopesRemoved) {
    return {
      operation: CaveatMutatorOperation.updateValue,
      value: {
        requiredScopes: newRequiredScopes.reduce(reduceKeysHelper, {}),
        optionalScopes: newOptionalScopes.reduce(reduceKeysHelper, {}),
      },
    };
  }

  return {
    operation: CaveatMutatorOperation.noop,
  };
}
