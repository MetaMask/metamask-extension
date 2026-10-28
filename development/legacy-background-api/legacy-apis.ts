import ts from 'typescript';
import {
  getOrLoadSourceFile,
  ResolutionContext,
} from './legacy-apis/module-resolution';
import { getControllerConnectionApiMemberNames } from './legacy-apis/controller-connection-api';
import { getPublicMethodNamesOfLegacyBackgroundApiService } from './legacy-apis/legacy-background-api-service';

/**
 * The name of a tracked legacy background API, which is also the key of its
 * snapshot entry.
 */
export type LegacyApiName =
  | 'legacyBackgroundApiServiceMethods'
  | 'messengerClientApiMethods'
  | 'getApiMethods'
  | 'adhocControllerConnectionMethods';

/**
 * Information about a legacy background API.
 */
export type LegacyApi = {
  /**
   * The name of the API, which is also the key of its snapshot entry.
   */
  name: LegacyApiName;
  /**
   * Explains, when the API gains methods that are not in the snapshot, where
   * those methods were added.
   */
  newMethodsExplanation: string;
};

/**
 * The repository-relative path of the file that defines
 * `LegacyBackgroundApiService`.
 */
export const LEGACY_BACKGROUND_API_SERVICE_FILE_PATH =
  'app/scripts/services/legacy-background-api-service.ts';

/**
 * The repository-relative path of the file that defines `MetamaskController`.
 */
export const METAMASK_CONTROLLER_FILE_PATH =
  'app/scripts/metamask-controller.js';

/**
 * The APIs tracked by the legacy background API snapshot, keyed by name.
 *
 * The controller connection API is split by where each method comes from, so
 * that the snapshot shows which part of `MetamaskController` exposes it.
 */
export const LEGACY_APIS = {
  legacyBackgroundApiServiceMethods: {
    name: 'legacyBackgroundApiServiceMethods',
    newMethodsExplanation:
      'New methods have been added to LegacyBackgroundApiService',
  },
  messengerClientApiMethods: {
    name: 'messengerClientApiMethods',
    newMethodsExplanation:
      'Some controller/service init functions return an `api` object that includes new methods',
  },
  getApiMethods: {
    name: 'getApiMethods',
    newMethodsExplanation:
      'New methods have been added to the API object returned by MetamaskController.getApi()',
  },
  adhocControllerConnectionMethods: {
    name: 'adhocControllerConnectionMethods',
    newMethodsExplanation:
      'New methods have been directly (or indirectly) added to the API object returned by MetamaskController.setupControllerConnection()',
  },
} as const satisfies Record<LegacyApiName, LegacyApi>;

/**
 * Reads the current names of every legacy API's members from the working tree.
 *
 * Several APIs are extracted from the same file, so each file is analyzed once
 * and split into its APIs, and parsed files are shared across all of them.
 *
 * @returns The names of the members currently exposed by each API.
 */
export function readApiMemberNames(): Record<LegacyApiName, Set<string>> {
  const context = {
    sourceFilesByPath: new Map<string, ts.SourceFile>(),
  } satisfies ResolutionContext;
  const legacyBackgroundApiServiceSourceFile = getOrLoadSourceFile(
    context,
    LEGACY_BACKGROUND_API_SERVICE_FILE_PATH,
  );
  const metamaskControllerSourceFile = getOrLoadSourceFile(
    context,
    METAMASK_CONTROLLER_FILE_PATH,
  );

  return {
    legacyBackgroundApiServiceMethods:
      getPublicMethodNamesOfLegacyBackgroundApiService(
        legacyBackgroundApiServiceSourceFile,
        context,
      ),
    ...getControllerConnectionApiMemberNames(
      metamaskControllerSourceFile,
      context,
    ),
  };
}
