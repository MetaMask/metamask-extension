import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { submitRequestToBackground } from '../../store/background-connection';
import { PerpsRouteWrapper } from './PerpsRouteWrapper';
import { getPerpsStreamManager } from './PerpsStreamManager';
import { isPerpsControllerInitializationCancelledError } from './getPerpsController';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('./PerpsStreamManager', () => ({
  getPerpsStreamManager: jest.fn(),
}));

jest.mock('./getPerpsController', () => ({
  isPerpsControllerInitializationCancelledError: jest.fn(() => false),
}));

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../selectors/accounts', () => ({
  getSelectedInternalAccount: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockGetPerpsStreamManager = jest.mocked(getPerpsStreamManager);
const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockIsCancelledError = jest.mocked(
  isPerpsControllerInitializationCancelledError,
);

function buildMockStreamManager({
  hasCachedData = false,
}: { hasCachedData?: boolean } = {}) {
  return {
    init: jest.fn().mockResolvedValue(undefined),
    prewarm: jest.fn(),
    cleanupPrewarm: jest.fn(),
    positions: { hasCachedData: jest.fn(() => hasCachedData) },
    orders: { hasCachedData: jest.fn(() => false) },
    account: { hasCachedData: jest.fn(() => false) },
  } as unknown as ReturnType<typeof getPerpsStreamManager>;
}

describe('PerpsRouteWrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined as never);
  });

  it('renders error when no account is selected', () => {
    mockUseSelector.mockReturnValue(undefined);
    mockGetPerpsStreamManager.mockReturnValue(buildMockStreamManager());

    render(
      <PerpsRouteWrapper>
        <div>child</div>
      </PerpsRouteWrapper>,
    );

    expect(screen.getByText(/Failed to initialize Perps/u)).toBeInTheDocument();
  });

  it('renders children after successful initialization', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager();
    mockGetPerpsStreamManager.mockReturnValue(manager);

    await act(async () => {
      render(
        <PerpsRouteWrapper>
          <div>child content</div>
        </PerpsRouteWrapper>,
      );
    });

    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(manager.init).toHaveBeenCalledWith('0xabc');
    expect(manager.prewarm).toHaveBeenCalled();
  });

  it('calls perpsInit before streamManager.init (sequential ordering)', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const callOrder: string[] = [];

    mockSubmitRequestToBackground.mockImplementation(() => {
      callOrder.push('perpsInit');
      return Promise.resolve(undefined as never);
    });

    const manager = buildMockStreamManager();
    manager.init = jest.fn().mockImplementation(() => {
      callOrder.push('streamManager.init');
      return Promise.resolve(undefined);
    });
    mockGetPerpsStreamManager.mockReturnValue(manager);

    await act(async () => {
      render(
        <PerpsRouteWrapper>
          <div>child content</div>
        </PerpsRouteWrapper>,
      );
    });

    expect(callOrder).toEqual(['perpsInit', 'streamManager.init']);
  });

  it('renders loadingFallback while initializing without cache', () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager({ hasCachedData: false });
    mockGetPerpsStreamManager.mockReturnValue(manager);
    manager.init = jest.fn(() => new Promise(() => undefined));

    render(
      <PerpsRouteWrapper loadingFallback={<div>loading...</div>}>
        <div>child content</div>
      </PerpsRouteWrapper>,
    );

    expect(screen.getByText('loading...')).toBeInTheDocument();
    expect(screen.queryByText('child content')).not.toBeInTheDocument();
  });

  it('renders children immediately when cached data exists', () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager({ hasCachedData: true });
    mockGetPerpsStreamManager.mockReturnValue(manager);
    manager.init = jest.fn(() => new Promise(() => undefined));

    render(
      <PerpsRouteWrapper loadingFallback={<div>loading...</div>}>
        <div>child content</div>
      </PerpsRouteWrapper>,
    );

    expect(screen.getByText('child content')).toBeInTheDocument();
    expect(screen.queryByText('loading...')).not.toBeInTheDocument();
  });

  it('renders error when init fails with Error', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager();
    mockGetPerpsStreamManager.mockReturnValue(manager);
    manager.init = jest.fn().mockRejectedValue(new Error('network down'));

    await act(async () => {
      render(
        <PerpsRouteWrapper>
          <div>child</div>
        </PerpsRouteWrapper>,
      );
    });

    expect(
      screen.getByText(/Failed to initialize Perps: network down/u),
    ).toBeInTheDocument();
  });

  it('renders error when init fails with plain object', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager();
    mockGetPerpsStreamManager.mockReturnValue(manager);
    manager.init = jest.fn().mockRejectedValue({ code: 500 });

    await act(async () => {
      render(
        <PerpsRouteWrapper>
          <div>child</div>
        </PerpsRouteWrapper>,
      );
    });

    expect(
      screen.getByText(/Failed to initialize Perps:.*500/u),
    ).toBeInTheDocument();
  });

  it('renders error when init fails with string', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager();
    mockGetPerpsStreamManager.mockReturnValue(manager);
    manager.init = jest.fn().mockRejectedValue('string error');

    await act(async () => {
      render(
        <PerpsRouteWrapper>
          <div>child</div>
        </PerpsRouteWrapper>,
      );
    });

    expect(
      screen.getByText(/Failed to initialize Perps: string error/u),
    ).toBeInTheDocument();
  });

  it('silently ignores cancelled initialization errors', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager();
    mockGetPerpsStreamManager.mockReturnValue(manager);
    const cancelledError = new Error('cancelled');
    manager.init = jest.fn().mockRejectedValue(cancelledError);
    mockIsCancelledError.mockReturnValue(true);

    await act(async () => {
      render(
        <PerpsRouteWrapper loadingFallback={<div>loading...</div>}>
          <div>child</div>
        </PerpsRouteWrapper>,
      );
    });

    expect(screen.queryByText(/Failed to initialize Perps/u)).toBeNull();
  });

  it('calls cleanupPrewarm on unmount', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager();
    mockGetPerpsStreamManager.mockReturnValue(manager);

    let unmount: () => void;
    await act(async () => {
      const result = render(
        <PerpsRouteWrapper>
          <div>child</div>
        </PerpsRouteWrapper>,
      );
      unmount = result.unmount;
    });

    act(() => {
      unmount();
    });

    expect(manager.cleanupPrewarm).toHaveBeenCalled();
  });

  it('calls submitRequestToBackground for perpsInit', async () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager();
    mockGetPerpsStreamManager.mockReturnValue(manager);

    await act(async () => {
      render(
        <PerpsRouteWrapper>
          <div>child</div>
        </PerpsRouteWrapper>,
      );
    });

    expect(mockSubmitRequestToBackground).toHaveBeenCalledWith('perpsInit');
  });

  it('renders null as default loadingFallback', () => {
    mockUseSelector.mockReturnValue({ address: '0xabc' });
    const manager = buildMockStreamManager({ hasCachedData: false });
    mockGetPerpsStreamManager.mockReturnValue(manager);
    manager.init = jest.fn(() => new Promise(() => undefined));

    const { container } = render(
      <PerpsRouteWrapper>
        <div>child content</div>
      </PerpsRouteWrapper>,
    );

    expect(container.innerHTML).toBe('');
  });
});
