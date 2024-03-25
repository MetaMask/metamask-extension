import { SubjectMetadataController } from '@metamask/permission-controller';
import { ControllerMessenger } from '@metamask/base-controller';
import { getSnapName } from './getSnapName';

const MOCK_SNAP_NAME = 'snap.test';
const MOCK_SNAP_PREFIX = 'local';
const MOCK_SNAP_ORIGIN = `${MOCK_SNAP_PREFIX}:${MOCK_SNAP_NAME}`;

function setupControllerMessenger() {
  const controllerMessenger = new ControllerMessenger();

  // The SubjectMetadataController also requires some methods from PermissionController
  controllerMessenger.registerActionHandler(
    'PermissionController:hasPermissions',
    // Not important for our tests
    (_) => true as never,
  );

  const subjectMetadata = [
    {
      origin: MOCK_SNAP_ORIGIN,
      name: MOCK_SNAP_NAME,
    },
  ];
  const subjectMetadataController = new SubjectMetadataController({
    messenger: controllerMessenger.getRestricted({
      name: 'SubjectMetadataController',
      allowedActions: [
        'PermissionController:hasPermissions' as unknown as never,
      ],
    }),
    subjectCacheLimit: subjectMetadata.length,
  });
  subjectMetadata.forEach((x) =>
    subjectMetadataController.addSubjectMetadata(x),
  );

  return controllerMessenger;
}

function getSnapKeyringBuilderMessenger(
  controllerMessenger: any,
  allowedActions: string[],
) {
  return controllerMessenger.getRestricted({
    name: 'SnapKeyringBuilder',
    allowedActions,
  });
}

describe('getSnapName', () => {
  const controllerMessenger = setupControllerMessenger();
  const messenger = getSnapKeyringBuilderMessenger(controllerMessenger, [
    'SubjectMetadataController:getSubjectMetadata',
  ]);

  it('should return the snap name', () => {
    expect(getSnapName(messenger, MOCK_SNAP_ORIGIN)).toBe(MOCK_SNAP_NAME);
  });

  it('should return the snap name even if the SubjectMetadata is not known', () => {
    const snapName = 'unknown-snap.test';
    const snapId = `${MOCK_SNAP_PREFIX}:${snapName}`;

    expect(getSnapName(messenger, snapId)).toBe(snapName);
  });

  it('should return null if snapId is null', () => {
    // In our case we should probably never get a `null` origin (== snapId), but for the sake
    // of completeness we make sure this is a well defined behavior
    expect(getSnapName(messenger, null as unknown as string)).toBe(null);
  });

  it('should return null if snapId is undefined', () => {
    // Same here
    expect(getSnapName(messenger, undefined as unknown as string)).toBe(null);
  });

  it('should raise if the SubjectMetadata cannot be retrieved', () => {
    // Disallow calls to `:getSubjectMetadata`
    const unallowedMessenger = getSnapKeyringBuilderMessenger(
      controllerMessenger,
      [],
    );

    expect(() => {
      return getSnapName(unallowedMessenger, MOCK_SNAP_ORIGIN);
    }).toThrowError();
  });
});
