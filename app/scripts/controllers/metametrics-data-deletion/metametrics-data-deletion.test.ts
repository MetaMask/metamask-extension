import { ControllerMessenger } from '@metamask/base-controller';
import {
  AllowedActions,
  MetaMetricsDataDeletionController,
  type MetaMetricsDataDeletionControllerMessengerActions,
} from './metametrics-data-deletion';

describe('MetaMetricsDataDeletionController', () => {
  describe('createMetaMetricsDataDeletionTask', () => {
    it('creates a data deletion task and stores ID when user is participating in metrics tracking', async () => {
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        metaMetricsId: mockMetaMetricsId,
        options: {
          dataDeletionService: {
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
      ).toHaveBeenCalledWith(mockMetaMetricsId);
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
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        metaMetricsId: mockMetaMetricsId,
        options: {
          dataDeletionService: {
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
      ).toHaveBeenCalledWith(mockMetaMetricsId);
      expect(controller.state).toStrictEqual({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionTimestamp: expect.any(Number),
        metaMetricsDataDeletionStatus: 'UNKNOWN',
      });
    });

    it('fails to creates a data deletion task when user has never participating in metrics tracking', async () => {
      const { controller } = setupController({
        metaMetricsId: null,
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
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        metaMetricsId: mockMetaMetricsId,
        options: {
          dataDeletionService: {
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
});

/**
 * Setup a test controller instance.
 *
 * @param options - Setup options.
 * @param options.options - Controller constructor options.
 * @param options.metaMetricsId - The MetaMetrics ID to use.
 * @returns The test controller, a messenger instance, and related mocks.
 */
function setupController({
  options,
  metaMetricsId,
}: {
  options?: Partial<
    ConstructorParameters<typeof MetaMetricsDataDeletionController>[0]
  >;
  metaMetricsId?: string | null;
} = {}): {
  controller: MetaMetricsDataDeletionController;
  dataDeletionService: ConstructorParameters<
    typeof MetaMetricsDataDeletionController
  >[0]['dataDeletionService'];
  messenger: ControllerMessenger<
    MetaMetricsDataDeletionControllerMessengerActions | AllowedActions,
    never
  >;
} {
  const controllerMessenger = new ControllerMessenger<
    MetaMetricsDataDeletionControllerMessengerActions | AllowedActions,
    never
  >();
  controllerMessenger.registerActionHandler(
    'MetaMetricsController:getState',
    jest.fn().mockReturnValue({ metaMetricsId }),
  );
  const mockCreateDataDeletionRegulationTaskResponse = 'mockRegulateId';
  const mockFetchDeletionRegulationStatusResponse = 'UNKNOWN';
  const mockDataDeletionService = {
    createDataDeletionRegulationTask: jest
      .fn()
      .mockResolvedValue(mockCreateDataDeletionRegulationTaskResponse),
    fetchDeletionRegulationStatus: jest
      .fn()
      .mockResolvedValue(mockFetchDeletionRegulationStatusResponse),
    ...options?.dataDeletionService,
  };
  const constructorOptions = {
    dataDeletionService: mockDataDeletionService,
    getMetaMetricsId: jest.fn().mockReturnValue('mockMetaMetricsId'),
    messenger: controllerMessenger.getRestricted({
      name: 'MetaMetricsDataDeletionController',
      allowedActions: ['MetaMetricsController:getState'],
      allowedEvents: [],
    }),
    ...options,
  };
  const controller = new MetaMetricsDataDeletionController(constructorOptions);

  return {
    controller,
    dataDeletionService: constructorOptions.dataDeletionService,
    messenger: controllerMessenger,
  };
}
