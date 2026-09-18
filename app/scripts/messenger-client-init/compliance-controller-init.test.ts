import { ComplianceController } from '@metamask/compliance-controller';
import { buildControllerInitRequestMock } from './test/utils';
import { ComplianceControllerInit } from './compliance-controller-init';
import type { ComplianceControllerMessenger } from './messengers/compliance-controller-messenger';

jest.mock('@metamask/compliance-controller', () => ({
  ComplianceController: jest.fn().mockImplementation(() => ({
    checkWalletsCompliance: jest.fn(),
  })),
}));

describe('ComplianceControllerInit', () => {
  const ComplianceControllerMock = jest.mocked(ComplianceController);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates ComplianceController with persisted state', () => {
    const persistedState = {
      walletComplianceStatusMap: {
        '0xblocked': {
          address: '0xblocked',
          blocked: true,
          checkedAt: '2026-05-05T00:00:00.000Z',
        },
      },
      lastCheckedAt: '2026-05-05T00:00:00.000Z',
    };
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: {
        call: jest.fn(),
      } as unknown as ComplianceControllerMessenger,
      initMessenger: undefined,
    };
    request.persistedState.ComplianceController = persistedState;

    const result = ComplianceControllerInit(request);

    expect(result.messengerClient).toBeDefined();
    expect(result.api).toBeDefined();
    expect(ComplianceControllerMock).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
      state: persistedState,
    });
  });

  it('exposes complianceCheckWalletsCompliance through the background API', async () => {
    const checkWalletsCompliance = jest
      .fn()
      .mockResolvedValue([{ address: '0xabc', blocked: false }]);
    ComplianceControllerMock.mockImplementationOnce(
      () =>
        ({
          checkWalletsCompliance,
        }) as never,
    );
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: {
        call: jest.fn(),
      } as unknown as ComplianceControllerMessenger,
      initMessenger: undefined,
    };

    const { api } = ComplianceControllerInit(request);

    await expect(
      api?.complianceCheckWalletsCompliance(['0xabc']),
    ).resolves.toEqual([{ address: '0xabc', blocked: false }]);
    expect(checkWalletsCompliance).toHaveBeenCalledWith(['0xabc']);
  });
});
