import { JsonSnapsRegistry } from '@metamask/snaps-controllers';
import { SemVerVersion } from '@metamask/utils';
import { parse } from 'semver';
import { ControllerInitFunction } from '../types';
import { SnapsRegistryMessenger } from '../messengers/snaps';
import { getBooleanFlag } from '../../lib/util';

/**
 * Initialize the Snaps registry controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const SnapsRegistryInit: ControllerInitFunction<
  JsonSnapsRegistry,
  SnapsRegistryMessenger
> = ({ controllerMessenger, persistedState }) => {
  const requireAllowlist = getBooleanFlag(process.env.REQUIRE_SNAPS_ALLOWLIST);

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const parsedVersion = parse(process.env.METAMASK_VERSION)!;
  // Strip prerelease versions as they just indicate build types.
  const version =
    `${parsedVersion.major}.${parsedVersion.minor}.${parsedVersion.patch}` as SemVerVersion;

  const controller = new JsonSnapsRegistry({
    // @ts-expect-error: `persistedState.SnapsRegistry` is not compatible
    // with the expected type.
    // TODO: Look into the type mismatch.
    state: persistedState.SnapsRegistry,
    messenger: controllerMessenger,
    refetchOnAllowlistMiss: requireAllowlist,
    clientConfig: {
      type: 'extension',
      version,
    },
  });

  return {
    controller,
  };
};
