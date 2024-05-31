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
