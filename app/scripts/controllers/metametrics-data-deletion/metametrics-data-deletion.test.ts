import { ControllerMessenger } from '@metamask/base-controller';
import {
  MetaMetricsDataDeletionController,
  type MetaMetricsDataDeletionControllerMessengerActions,
} from './metametrics-data-deletion';

describe('MetaMetricsDataDeletionController', () => {
  describe('createMetaMetricsDataDeletionTask', () => {
    it('creates a data deletion task and stores ID when user is participating in metrics tracking', async () => {
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        options: {
          getMetaMetricsId: jest.fn().mockReturnValue(mockMetaMetricsId),
          getParticipateInMetrics: jest.fn().mockReturnValue(true),
        },
        dataDeletionService: {
          createDataDeletionRegulationTask: jest
            .fn()
            .mockResolvedValue(mockTaskId),
          fetchDeletionRegulationStatus: jest.fn().mockResolvedValue('UNKNOWN'),
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
      expect(controller.state).toMatchObject({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionDate: expect.any(Number),
        metaMetricsDataDeletionStatus: 'UNKNOWN',
        participateInDuringDeletion: true,
      });
    });
    it('creates a data deletion task and stores ID when user is not currently participating in metrics tracking', async () => {
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        options: {
          getMetaMetricsId: jest.fn().mockReturnValue(mockMetaMetricsId),
          getParticipateInMetrics: jest.fn().mockReturnValue(false),
        },
        dataDeletionService: {
          createDataDeletionRegulationTask: jest
            .fn()
            .mockResolvedValue(mockTaskId),
          fetchDeletionRegulationStatus: jest.fn().mockResolvedValue('UNKNOWN'),
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
      expect(controller.state).toMatchObject({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionDate: expect.any(Number),
        metaMetricsDataDeletionStatus: 'UNKNOWN',
        participateInDuringDeletion: false,
      });
    });

    it('fails to creates a data deletion task when user has never participating in metrics tracking', async () => {
      const { controller } = setupController({
        options: {
          getMetaMetricsId: jest.fn().mockReturnValue(null),
          getParticipateInMetrics: jest.fn().mockReturnValue(null),
        },
      });
      await expect(
        controller.createMetaMetricsDataDeletionTask(),
      ).rejects.toThrow();
      expect(controller.state).toMatchObject({
        metaMetricsDataDeletionId: null,
        metaMetricsDataDeletionDate: expect.any(Number),
        participateInDuringDeletion: null,
      });
    });
  });
  describe('updateDataDeletionTaskStatus', () => {
    it('fetches and stores status of the delete regulation using delete regulation ID', async () => {
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        options: {
          getMetaMetricsId: jest.fn().mockReturnValue(mockMetaMetricsId),
          getParticipateInMetrics: jest.fn().mockReturnValue(true),
        },
        dataDeletionService: {
          createDataDeletionRegulationTask: jest
            .fn()
            .mockResolvedValue(mockTaskId),
          fetchDeletionRegulationStatus: jest.fn().mockResolvedValue('UNKNOWN'),
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
      expect(controller.state).toMatchObject({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionDate: expect.any(Number),
        metaMetricsDataDeletionStatus: 'UNKNOWN',
        participateInDuringDeletion: true,
      });
    });
  });
});

/**
 * Setup a test controller instance.
 *
 * @param options - Setup options.
 * @param options.options - Controller constructor options.
 * @param options.dataDeletionService - A partial mock of the DataDeletionService.
 * @returns The test controller, a messenger instance, and related mocks.
 */
function setupController({
  options,
  dataDeletionService,
}: {
  options?: Partial<
    ConstructorParameters<typeof MetaMetricsDataDeletionController>[0]
  >;
  dataDeletionService?: Partial<
    ConstructorParameters<
      typeof MetaMetricsDataDeletionController
    >[0]['dataDeletionService']
  >;
} = {}): {
  controller: MetaMetricsDataDeletionController;
  dataDeletionService: ConstructorParameters<
    typeof MetaMetricsDataDeletionController
  >[0]['dataDeletionService'];
  messenger: ControllerMessenger<
    MetaMetricsDataDeletionControllerMessengerActions,
    never
  >;
} {
  const messenger = new ControllerMessenger<
    MetaMetricsDataDeletionControllerMessengerActions,
    never
  >();
  const mockCreateDataDeletionRegulationTaskResponse = 'mockRegulateId';
  const mockFetchDeletionRegulationStatusResponse = 'UNKNOWN';
  const mockDataDeletionService = {
    createDataDeletionRegulationTask: jest
      .fn()
      .mockResolvedValue(mockCreateDataDeletionRegulationTaskResponse),
    fetchDeletionRegulationStatus: jest
      .fn()
      .mockResolvedValue(mockFetchDeletionRegulationStatusResponse),
    ...dataDeletionService,
  };
  const constructorOptions = {
    dataDeletionService: mockDataDeletionService,
    getMetaMetricsId: jest.fn().mockReturnValue('mockMetaMetricsId'),
    getParticipateInMetrics: jest.fn().mockReturnValue(true),
    messenger: messenger.getRestricted({
      name: 'MetaMetricsDataDeletionController',
      allowedActions: [],
      allowedEvents: [],
    }),
    ...options,
  };
  const controller = new MetaMetricsDataDeletionController(constructorOptions);

  return {
    controller,
    dataDeletionService: constructorOptions.dataDeletionService,
    messenger,
  };
}
