import { ComplianceService } from '@metamask/compliance-controller';
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
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it('creates ComplianceService with configured API URL', () => {
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger: {
        call: jest.fn(),
      } as unknown as ComplianceServiceMessenger,
      initMessenger: undefined,
    };

    const result = ComplianceServiceInit(request);

    expect(result.messengerClient).toBeDefined();
    expect(result.persistedStateKey).toBeNull();
    expect(result.memStateKey).toBeNull();
    expect(ComplianceServiceMock).toHaveBeenCalledWith({
      apiUrl: process.env.COMPLIANCE_API_URL,
      messenger: request.controllerMessenger,
      fetch: expect.any(Function),
    });
  });
});
