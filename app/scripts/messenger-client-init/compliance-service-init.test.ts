import { ComplianceService } from '@metamask/compliance-controller';
import { isProduction } from '../../../shared/lib/environment';
import { buildControllerInitRequestMock } from './test/utils';
import { ComplianceServiceInit } from './compliance-service-init';
import type { ComplianceServiceMessenger } from './messengers/compliance-service-messenger';

jest.mock('@metamask/compliance-controller', () => ({
  ComplianceService: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('../../../shared/lib/environment');

const isProductionMock = jest.mocked(isProduction);

describe('ComplianceServiceInit', () => {
  const ComplianceServiceMock = jest.mocked(ComplianceService);
  const fetchMock = jest.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    isProductionMock.mockReturnValue(false);
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('creates ComplianceService with production environment for production builds', () => {
    isProductionMock.mockReturnValue(true);
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: {
        call: jest.fn(),
      } as unknown as ComplianceServiceMessenger,
      initMessenger: undefined,
    };

    const result = ComplianceServiceInit(request);

    expect(result.messengerClient).toBeDefined();
    expect(ComplianceServiceMock).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
      fetch: expect.any(Function),
      env: 'production',
    });
  });

  it('creates ComplianceService with development environment outside production-like builds', () => {
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: {
        call: jest.fn(),
      } as unknown as ComplianceServiceMessenger,
      initMessenger: undefined,
    };

    ComplianceServiceInit(request);

    expect(ComplianceServiceMock).toHaveBeenCalledWith({
      messenger: request.controllerMessenger,
      fetch: expect.any(Function),
      env: 'development',
    });
  });
});
