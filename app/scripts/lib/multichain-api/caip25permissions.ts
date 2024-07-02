import type {
  PermissionSpecificationBuilder,
  EndowmentGetterParams,
  ValidPermissionSpecification,
  PermissionValidatorConstraint,
  PermissionConstraint,
} from '@metamask/permission-controller';
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
