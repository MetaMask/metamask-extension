import { ComplianceService } from '@metamask/compliance-controller';
import { ENVIRONMENT } from '../../../development/build/constants';
import { buildControllerInitRequestMock } from './test/utils';
import { ComplianceServiceInit } from './compliance-service-init';
import type { ComplianceServiceMessenger } from './messengers/compliance-service-messenger';

jest.mock('@metamask/compliance-controller', () => ({
  ComplianceService: jest.fn().mockImplementation(() => ({})),
}));

describe('ComplianceServiceInit', () => {
  const ComplianceServiceMock = jest.mocked(ComplianceService);
  const fetchMock = jest.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;
    delete process.env.METAMASK_ENVIRONMENT;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('creates ComplianceService with production environment for production builds', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.PRODUCTION;
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

  it('creates ComplianceService with development environment outside production builds', () => {
    process.env.METAMASK_ENVIRONMENT = ENVIRONMENT.DEVELOPMENT;
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
