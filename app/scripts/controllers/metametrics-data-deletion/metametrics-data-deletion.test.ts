import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { DeleteRegulationStatus } from '../../../../shared/constants/metametrics';
import {
  MetaMetricsDataDeletionController,
  MetaMetricsDataDeletionControllerMessenger,
} from './metametrics-data-deletion';

describe('MetaMetricsDataDeletionController', () => {
  describe('createMetaMetricsDataDeletionTask', () => {
    it('creates a data deletion task and stores ID when user is participating in metrics tracking', async () => {
      const mockAnalyticsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        analyticsId: mockAnalyticsId,
        options: {
          dataDeletionService: {
            name: 'DataDeletionService' as const,
            createDataDeletionRegulationTask: jest
              .fn()
              .mockResolvedValue(mockTaskId),
            fetchDeletionRegulationStatus: jest
              .fn()
              .mockResolvedValue('UNKNOWN'),
          },
        },
      });

      await controller.createMetaMetricsDataDeletionTask();
      expect(
        dataDeletionService.createDataDeletionRegulationTask,
      ).toHaveBeenCalledWith(mockAnalyticsId);
      expect(
        dataDeletionService.createDataDeletionRegulationTask,
      ).toHaveBeenCalledTimes(1);
      expect(
        dataDeletionService.fetchDeletionRegulationStatus,
      ).toHaveBeenCalledTimes(1);
      expect(controller.state).toStrictEqual({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionTimestamp: expect.any(Number),
        metaMetricsDataDeletionStatus: 'UNKNOWN',
      });
    });
    it('creates a data deletion task and stores ID when user is not currently participating in metrics tracking', async () => {
      const mockAnalyticsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        analyticsId: mockAnalyticsId,
        options: {
          dataDeletionService: {
            name: 'DataDeletionService' as const,
            createDataDeletionRegulationTask: jest
              .fn()
              .mockResolvedValue(mockTaskId),
            fetchDeletionRegulationStatus: jest
              .fn()
              .mockResolvedValue('UNKNOWN'),
          },
        },
      });

      await controller.createMetaMetricsDataDeletionTask();

      expect(
        dataDeletionService.createDataDeletionRegulationTask,
      ).toHaveBeenCalledTimes(1);
      expect(
        dataDeletionService.fetchDeletionRegulationStatus,
      ).toHaveBeenCalledTimes(1);
      expect(
        dataDeletionService.createDataDeletionRegulationTask,
      ).toHaveBeenCalledWith(mockAnalyticsId);
      expect(controller.state).toStrictEqual({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionTimestamp: expect.any(Number),
        metaMetricsDataDeletionStatus: 'UNKNOWN',
      });
    });

    it('fails to creates a data deletion task when user has never participating in metrics tracking', async () => {
      const { controller } = setupController({
        analyticsId: null,
      });
      await expect(
        controller.createMetaMetricsDataDeletionTask(),
      ).rejects.toThrow();
      expect(controller.state).toStrictEqual({
        metaMetricsDataDeletionId: null,
        metaMetricsDataDeletionTimestamp: expect.any(Number),
      });
    });
  });
  describe('updateDataDeletionTaskStatus', () => {
    it('fetches and stores status of the delete regulation using delete regulation ID', async () => {
      const mockAnalyticsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        analyticsId: mockAnalyticsId,
        options: {
          dataDeletionService: {
            name: 'DataDeletionService' as const,
            createDataDeletionRegulationTask: jest
              .fn()
              .mockResolvedValue(mockTaskId),
            fetchDeletionRegulationStatus: jest
              .fn()
              .mockResolvedValue('UNKNOWN'),
          },
        },
      });
      await controller.createMetaMetricsDataDeletionTask();
      await controller.updateDataDeletionTaskStatus();
      expect(
        dataDeletionService.fetchDeletionRegulationStatus,
      ).toHaveBeenCalledTimes(2);
      expect(
        dataDeletionService.fetchDeletionRegulationStatus,
      ).toHaveBeenCalledWith(mockTaskId);
      expect(controller.state).toStrictEqual({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionTimestamp: expect.any(Number),
        metaMetricsDataDeletionStatus: 'UNKNOWN',
      });
    });
  });

  describe('metadata', () => {
    it('includes expected state in debug snapshots', () => {
      const { controller } = setupController({
        options: {
          state: {
            // Populate optional properties to ensure they show up in snapshot
            metaMetricsDataDeletionStatus: DeleteRegulationStatus.Unknown,
          },
        },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'includeInDebugSnapshot',
        ),
      ).toMatchInlineSnapshot(`
        {
          "metaMetricsDataDeletionId": null,
          "metaMetricsDataDeletionStatus": "UNKNOWN",
          "metaMetricsDataDeletionTimestamp": 0,
        }
      `);
    });

    it('includes expected state in state logs', () => {
      const { controller } = setupController({
        options: {
          state: {
            // Populate optional properties to ensure they show up in snapshot
            metaMetricsDataDeletionStatus: DeleteRegulationStatus.Unknown,
          },
        },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'includeInStateLogs',
        ),
      ).toMatchInlineSnapshot(`
        {
          "metaMetricsDataDeletionId": null,
          "metaMetricsDataDeletionStatus": "UNKNOWN",
          "metaMetricsDataDeletionTimestamp": 0,
        }
      `);
    });

    it('persists expected state', () => {
      const { controller } = setupController({
        options: {
          state: {
            // Populate optional properties to ensure they show up in snapshot
            metaMetricsDataDeletionStatus: DeleteRegulationStatus.Unknown,
          },
        },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'persist',
        ),
      ).toMatchInlineSnapshot(`
        {
          "metaMetricsDataDeletionId": null,
          "metaMetricsDataDeletionStatus": "UNKNOWN",
          "metaMetricsDataDeletionTimestamp": 0,
        }
      `);
    });

    it('exposes expected state to UI', () => {
      const { controller } = setupController({
        options: {
          state: {
            // Populate optional properties to ensure they show up in snapshot
            metaMetricsDataDeletionStatus: DeleteRegulationStatus.Unknown,
          },
        },
      });

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'usedInUi',
        ),
      ).toMatchInlineSnapshot(`
        {
          "metaMetricsDataDeletionId": null,
          "metaMetricsDataDeletionStatus": "UNKNOWN",
          "metaMetricsDataDeletionTimestamp": 0,
        }
      `);
    });
  });
});

type RootMessenger = Messenger<
  MockAnyNamespace,
  MessengerActions<MetaMetricsDataDeletionControllerMessenger>,
  MessengerEvents<MetaMetricsDataDeletionControllerMessenger>
>;

/**
 * Setup a test controller instance.
 *
 * @param options - Setup options.
 * @param options.options - Controller constructor options.
 * @param options.analyticsId - The analytics ID to use.
 * @returns The test controller, a messenger instance, and related mocks.
 */
function setupController({
  options,
  analyticsId,
}: {
  options?: Partial<
    ConstructorParameters<typeof MetaMetricsDataDeletionController>[0]
  >;
  analyticsId?: string | null;
} = {}): {
  controller: MetaMetricsDataDeletionController;
  dataDeletionService: ConstructorParameters<
    typeof MetaMetricsDataDeletionController
  >[0]['dataDeletionService'];
  messenger: RootMessenger;
} {
  const messenger: RootMessenger = new Messenger({
    namespace: MOCK_ANY_NAMESPACE,
  });
  messenger.registerActionHandler(
    'AnalyticsController:getState',
    jest.fn().mockReturnValue({ analyticsId }),
  );
  const mockCreateDataDeletionRegulationTaskResponse = 'mockRegulateId';
  const mockFetchDeletionRegulationStatusResponse = 'UNKNOWN';
  const mockDataDeletionService = {
    name: 'DataDeletionService' as const,
    createDataDeletionRegulationTask: jest
      .fn()
      .mockResolvedValue(mockCreateDataDeletionRegulationTaskResponse),
    fetchDeletionRegulationStatus: jest
      .fn()
      .mockResolvedValue(mockFetchDeletionRegulationStatusResponse),
    ...options?.dataDeletionService,
  };
  const controllerMessenger = new Messenger<
    'MetaMetricsDataDeletionController',
    MessengerActions<MetaMetricsDataDeletionControllerMessenger>,
    MessengerEvents<MetaMetricsDataDeletionControllerMessenger>,
    typeof messenger
  >({
    namespace: 'MetaMetricsDataDeletionController',
    parent: messenger,
  });
  messenger.delegate({
    messenger: controllerMessenger,
    actions: ['AnalyticsController:getState'],
  });
  const constructorOptions = {
    dataDeletionService: mockDataDeletionService,
    messenger: controllerMessenger,
    ...options,
  };
  const controller = new MetaMetricsDataDeletionController(constructorOptions);

  return {
    controller,
    dataDeletionService: constructorOptions.dataDeletionService,
    messenger,
  };
}
