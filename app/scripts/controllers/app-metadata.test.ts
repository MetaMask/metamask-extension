import { ControllerMessenger } from '@metamask/base-controller';
import AppMetadataController, {
  getDefaultAppMetadataControllerState,
  type AppMetadataControllerOptions,
} from './app-metadata';

describe('AppMetadataController', () => {
  describe('constructor', () => {
    it('accepts initial state and does not modify it if currentMigrationVersion and platform.getVersion() match respective values in state', async () => {
      const initState = {
        currentAppVersion: '1',
        previousAppVersion: '1',
        previousMigrationVersion: 1,
        currentMigrationVersion: 1,
      };
      withController(
        {
          state: initState,
          currentMigrationVersion: 1,
          currentAppVersion: '1',
        },
        ({ controller }) => {
          expect(controller.state).toStrictEqual(initState);
        },
      );
    });

    it('sets default state and does not modify it', () => {
      withController({ state: {} }, ({ controller }) => {
        expect(controller.state).toStrictEqual(
          getDefaultAppMetadataControllerState(),
        );
      });
    });

    it('sets default state and does not modify it if options version parameters match respective default values', () => {
      withController(
        {
          state: {},
          currentMigrationVersion: 0,
          currentAppVersion: '',
        },
        ({ controller }) => {
          expect(controller.state).toStrictEqual(
            getDefaultAppMetadataControllerState(),
          );
        },
      );
    });

    it('updates the currentAppVersion state property if options.currentAppVersion does not match the default value', () => {
      withController(
        {
          state: {},
          currentMigrationVersion: 0,
          currentAppVersion: '1',
        },
        ({ controller }) => {
          expect(controller.state).toStrictEqual({
            ...getDefaultAppMetadataControllerState(),
            currentAppVersion: '1',
          });
        },
      );
    });

    it('updates the currentAppVersion and previousAppVersion state properties if options.currentAppVersion, currentAppVersion and previousAppVersion are all different', () => {
      withController(
        {
          state: {
            currentAppVersion: '2',
            previousAppVersion: '1',
          },
          currentAppVersion: '3',
          currentMigrationVersion: 0,
        },
        ({ controller }) => {
          expect(controller.state).toStrictEqual({
            ...getDefaultAppMetadataControllerState(),
            currentAppVersion: '3',
            previousAppVersion: '2',
          });
        },
      );
    });

    it('updates the currentMigrationVersion state property if the currentMigrationVersion param does not match the default value', () => {
      withController(
        {
          state: {},
          currentMigrationVersion: 1,
        },
        ({ controller }) => {
          expect(controller.state).toStrictEqual({
            ...getDefaultAppMetadataControllerState(),
            currentMigrationVersion: 1,
          });
        },
      );
    });

    it('updates the currentMigrationVersion and previousMigrationVersion state properties if the currentMigrationVersion param, the currentMigrationVersion state property and the previousMigrationVersion state property are all different', () => {
      withController(
        {
          state: {
            currentMigrationVersion: 2,
            previousMigrationVersion: 1,
          },
          currentMigrationVersion: 3,
        },
        ({ controller }) => {
          expect(controller.state).toStrictEqual({
            ...getDefaultAppMetadataControllerState(),
            currentMigrationVersion: 3,
            previousMigrationVersion: 2,
          });
        },
      );
    });
  });
});

type WithControllerOptions = Partial<AppMetadataControllerOptions>;

type WithControllerCallback<ReturnValue> = ({
  controller,
}: {
  controller: AppMetadataController;
}) => ReturnValue;

type WithControllerArgs<ReturnValue> =
  | [WithControllerCallback<ReturnValue>]
  | [WithControllerOptions, WithControllerCallback<ReturnValue>];

function withController<ReturnValue>(
  ...args: WithControllerArgs<ReturnValue>
): ReturnValue {
  const [options = {}, fn] = args.length === 2 ? args : [{}, args[0]];

  const controllerMessenger = new ControllerMessenger<never, never>();

  const messenger = controllerMessenger.getRestricted({
    name: 'AppMetadataController',
    allowedActions: [],
    allowedEvents: [],
  });

  return fn({
    controller: new AppMetadataController({
      messenger,
      ...options,
    }),
  });
}
