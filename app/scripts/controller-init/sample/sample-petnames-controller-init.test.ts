import { Hex } from '@metamask/utils';
import { SamplePetnamesControllerInit } from './sample-petnames-controller-init';

// Mock the controller class
jest.mock('../../controllers/sample', () => {
  return {
    SamplePetnamesController: jest.fn().mockImplementation(() => {
      return {
        assignPetname: jest.fn(),
      };
    }),
  };
});

const { SamplePetnamesController } = jest.requireMock(
  '../../controllers/sample',
);

describe('SamplePetnamesControllerInit', () => {
  let mockControllerMessenger: any;
  let mockControllerInstance: any;
  let mockPersistedState: { SamplePetnamesController: Record<string, unknown> };

  beforeEach(() => {
    jest.clearAllMocks();

    mockControllerMessenger = {};

    mockPersistedState = {
      SamplePetnamesController: { testState: 'value' },
    };

    mockControllerInstance = {
      assignPetname: jest.fn(),
    };

    SamplePetnamesController.mockImplementation(() => mockControllerInstance);
  });

  it('should initialize the controller with correct parameters', () => {
    const result = SamplePetnamesControllerInit({
      controllerMessenger: mockControllerMessenger,
      persistedState: mockPersistedState,
    } as any);

    expect(SamplePetnamesController).toHaveBeenCalledWith({
      messenger: mockControllerMessenger,
      state: mockPersistedState.SamplePetnamesController,
    });

    expect(result).toBeDefined();
    expect(result.controller).toBe(mockControllerInstance);
  });

  it('should return an API with assignPetname method', () => {
    const result = SamplePetnamesControllerInit({
      controllerMessenger: mockControllerMessenger,
      persistedState: mockPersistedState,
    } as any);

    // Ensure the API is defined.
    expect(result.api).toBeDefined();

    if (!result.api) {
      throw new Error('API is undefined');
    }

    const chainId = '0x1' as Hex;
    const address = '0x1234567890abcdef1234567890abcdef12345678' as Hex;
    const name = 'TestPetName';

    result.api.assignPetname(chainId, address, name);

    expect(mockControllerInstance.assignPetname).toHaveBeenCalledWith(
      chainId,
      address,
      name,
    );
  });
});
