import { Hex } from '@metamask/utils';
import type { SamplePetnamesControllerMessenger } from '@metamask/sample-controllers';
import type { ControllerInitRequest } from '../types';
import { buildControllerInitRequestMock } from '../test/utils';
import { SamplePetnamesControllerInit } from './sample-petnames-controller-init';

// Mock the controller class from the package
jest.mock('@metamask/sample-controllers', () => ({
  SamplePetnamesController: jest.fn().mockImplementation(() => ({
    assignPetname: jest.fn(),
  })),
}));

const { SamplePetnamesController } = jest.requireMock(
  '@metamask/sample-controllers',
) as { SamplePetnamesController: jest.Mock };

describe('SamplePetnamesControllerInit', () => {
  // Common test variables
  const mockControllerMessenger = {} as SamplePetnamesControllerMessenger;
  const mockPersistedState = {
    SamplePetnamesController: {
      namesByChainIdAndAddress: {},
    },
  };

  const mockControllerInstance = {
    assignPetname: jest.fn(),
  };

  /**
   * Creates a valid controller init request with all required properties
   *
   * @returns A properly configured controller init request
   */
  const createMockRequest =
    (): ControllerInitRequest<SamplePetnamesControllerMessenger> => {
      return {
        ...buildControllerInitRequestMock(),
        controllerMessenger: mockControllerMessenger,
        persistedState: mockPersistedState,
        initMessenger: undefined,
      };
    };

  /**
   * Sample test data for petname assignments
   */
  const testPetnameData = {
    chainId: '0x1' as Hex,
    address: '0x1234567890abcdef1234567890abcdef12345678' as Hex,
    name: 'TestPetName',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    SamplePetnamesController.mockImplementation(() => mockControllerInstance);
  });

  it('creates a new controller instance with the correct parameters', () => {
    // Arrange
    const request = createMockRequest();

    // Act
    const result = SamplePetnamesControllerInit(request);

    // Assert
    expect(SamplePetnamesController).toHaveBeenCalledWith({
      messenger: mockControllerMessenger,
      state: mockPersistedState.SamplePetnamesController,
    });
    expect(result.controller).toBe(mockControllerInstance);
  });

  it('provides an API that delegates assignPetname calls to the controller', () => {
    // Arrange
    const request = createMockRequest();
    const result = SamplePetnamesControllerInit(request);
    const { chainId, address, name } = testPetnameData;

    // Act
    expect(result.api).toBeDefined();
    result.api?.assignPetname(chainId, address, name);

    // Assert
    expect(mockControllerInstance.assignPetname).toHaveBeenCalledWith(
      chainId,
      address,
      name,
    );
  });
});
