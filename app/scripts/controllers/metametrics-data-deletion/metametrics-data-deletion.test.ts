import { ControllerMessenger } from '@metamask/base-controller';
import {
  MetaMetricsDataDeletionController,
  type MetaMetricsDataDeletionControllerMessengerActions,
} from './metametrics-data-deletion';

describe('MetaMetricsDataDeletionController', () => {
  describe('createMetaMetricsDataDeletionTask', () => {
    it('creates a data deletion task and stores ID', async () => {
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        options: {
          getMetaMetricsId: jest.fn().mockReturnValue(mockMetaMetricsId),
        },
        dataDeletionService: {
          createDataDeletionRegulationTask: jest
            .fn()
            .mockResolvedValue({ data: { regulateId: mockTaskId } }),
        },
      });

      await controller.createMetaMetricsDataDeletionTask();

      expect(
        dataDeletionService.createDataDeletionRegulationTask,
      ).toHaveBeenCalledTimes(1);
      expect(
        dataDeletionService.createDataDeletionRegulationTask,
      ).toHaveBeenCalledWith(mockMetaMetricsId);
      expect(controller.state).toMatchObject({
        metaMetricsDataDeletionId: mockTaskId,
        metaMetricsDataDeletionDate: expect.any(Number),
      });
    });
    it('calls updateDataDeletionTaskStatus right after creating the delete regulation', async () => {
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        options: {
          getMetaMetricsId: jest.fn().mockReturnValue(mockMetaMetricsId),
        },
        dataDeletionService: {
          createDataDeletionRegulationTask: jest
            .fn()
            .mockResolvedValue({ data: { regulateId: mockTaskId } }),
          fetchDeletionRegulationStatus: jest.fn().mockResolvedValue({
            data: {
              regulation: {
                overallStatus: 'UNKNOWN',
              },
            },
          }),
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
        },
        dataDeletionService: {
          createDataDeletionRegulationTask: jest
            .fn()
            .mockResolvedValue({ data: { regulateId: mockTaskId } }),
          fetchDeletionRegulationStatus: jest.fn().mockResolvedValue({
            data: {
              regulation: {
                overallStatus: 'UNKNOWN',
              },
            },
          }),
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
      });
    });
  });
  describe('setHasMetaMetricsDataRecorded', () => {
    it('updating hasMetaMetricsDataRecorded variable', async () => {
      const { controller } = setupController();
      controller.setHasMetaMetricsDataRecorded(true);
      expect(controller.state).toMatchObject({
        hasMetaMetricsDataRecorded: true,
      });
    });
    it('creates a data deletion task and updating hasMetaMetricsDataRecorded to false', async () => {
      const mockMetaMetricsId = 'mockId';
      const mockTaskId = 'mockTaskId';
      const { controller, dataDeletionService } = setupController({
        options: {
          getMetaMetricsId: jest.fn().mockReturnValue(mockMetaMetricsId),
        },
        dataDeletionService: {
          createDataDeletionRegulationTask: jest
            .fn()
            .mockResolvedValue({ data: { regulateId: mockTaskId } }),
        },
      });

      await controller.createMetaMetricsDataDeletionTask();
      controller.setHasMetaMetricsDataRecorded(false);

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
        hasMetaMetricsDataRecorded: false,
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
  const mockCreateDataDeletionRegulationTaskResponse = {
    data: {
      regulateId: 'mockRegulateId',
    },
  };
  const mockFetchDeletionRegulationStatusResponse = {
    data: {
      regulation: {
        overallStatus: 'UNKNOWN',
      },
    },
  };
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
