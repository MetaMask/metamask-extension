/**
 * @jest-environment jsdom
 */
import React from 'react';
import log from 'loglevel';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { ExtensionUpdateTakeover } from './extension-update-takeover';

const mockTrackEvent = jest.fn();

jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => key,
}));

jest.mock('../../../hooks/useAnalytics', () => ({
  useAnalytics: () => ({
    createEventBuilder: (name: string) => {
      const properties: Record<string, unknown> = {};
      const builder = {
        addCategory: () => builder,
        addProperties: (nextProperties: Record<string, unknown>) => {
          Object.assign(properties, nextProperties);
          return builder;
        },
        build: () => ({ name, properties: { ...properties } }),
      };
      return builder;
    },
    trackEvent: mockTrackEvent,
  }),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(() => 'fullscreen'),
}));

jest.mock('../../../store/actions', () => ({
  openUpdateTabAndReload: jest.fn(),
  rejectAllPendingApprovals: jest.fn(),
  setUpdateModalLastDismissedAt: jest.fn(),
}));

const {
  openUpdateTabAndReload,
  rejectAllPendingApprovals,
  setUpdateModalLastDismissedAt,
} = jest.requireMock('../../../store/actions');

function eventNames(): string[] {
  return mockTrackEvent.mock.calls.map(([event]) => event.name);
}

describe('ExtensionUpdateTakeover', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(getEnvironmentType).mockReturnValue('fullscreen');
    openUpdateTabAndReload.mockResolvedValue(undefined);
    rejectAllPendingApprovals.mockResolvedValue(undefined);
    setUpdateModalLastDismissedAt.mockResolvedValue(undefined);
  });

  it('renders the version update without a close button', async () => {
    render(<ExtensionUpdateTakeover promptType="versionUpdate" />);

    expect(screen.getByTestId('extension-update-takeover')).toHaveAttribute(
      'data-variant',
      'versionUpdate',
    );
    expect(
      screen.getByTestId('extension-update-takeover-title'),
    ).toHaveTextContent('extensionUpdateTitle');
    expect(
      screen.getByTestId('extension-update-takeover-update-button'),
    ).toHaveTextContent('extensionUpdatePrimaryAction');
    expect(
      screen.getByTestId('extension-update-takeover-dismiss-button'),
    ).toHaveTextContent('extensionUpdateSecondaryAction');
    expect(
      screen.queryByRole('button', { name: 'close' }),
    ).not.toBeInTheDocument();
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      '/images/logo/metamask-fox.svg',
    );

    await waitFor(() => {
      expect(document.activeElement).toBe(
        screen.getByTestId('extension-update-takeover-update-button'),
      );
    });
  });

  it('renders the unsupported variant', () => {
    render(<ExtensionUpdateTakeover promptType="unsupportedVersion" />);

    expect(
      screen.getByTestId('extension-update-takeover-title'),
    ).toHaveTextContent('extensionUpdateUnsupportedTitle');
    expect(
      screen.getByTestId('extension-update-takeover-update-button'),
    ).toHaveTextContent('extensionUpdateUnsupportedPrimaryAction');
    expect(
      screen.getByTestId('extension-update-takeover-dismiss-button'),
    ).toHaveTextContent('extensionUpdateUnsupportedSecondaryAction');
  });

  it('disables both buttons while updating and allows retry after rejection', async () => {
    openUpdateTabAndReload.mockRejectedValueOnce(new Error('reload failed'));
    const logError = jest
      .spyOn(log, 'error')
      .mockImplementation(() => undefined);

    render(<ExtensionUpdateTakeover promptType="versionUpdate" />);
    fireEvent.click(
      screen.getByTestId('extension-update-takeover-update-button'),
    );

    await waitFor(() => {
      expect(openUpdateTabAndReload).toHaveBeenCalledTimes(1);
      expect(
        screen.getByTestId('extension-update-takeover-update-button'),
      ).toBeEnabled();
      expect(
        screen.getByTestId('extension-update-takeover-dismiss-button'),
      ).toBeEnabled();
    });

    fireEvent.click(
      screen.getByTestId('extension-update-takeover-update-button'),
    );
    await waitFor(() => {
      expect(openUpdateTabAndReload).toHaveBeenCalledTimes(2);
    });

    logError.mockRestore();
  });

  it('persists dismissal once and allows retry when persistence rejects', async () => {
    let rejectDismissal: (error: Error) => void = () => undefined;
    setUpdateModalLastDismissedAt.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDismissal = reject;
        }),
    );

    render(<ExtensionUpdateTakeover promptType="unsupportedVersion" />);
    const dismissButton = screen.getByTestId(
      'extension-update-takeover-dismiss-button',
    );
    fireEvent.click(dismissButton);
    fireEvent.click(dismissButton);

    expect(setUpdateModalLastDismissedAt).toHaveBeenCalledTimes(1);
    rejectDismissal(new Error('persist failed'));

    await waitFor(() => {
      expect(dismissButton).toBeEnabled();
    });
    setUpdateModalLastDismissedAt.mockResolvedValue(undefined);
    fireEvent.click(dismissButton);
    await waitFor(() => {
      expect(setUpdateModalLastDismissedAt).toHaveBeenCalledTimes(2);
    });
  });

  it('tracks one view per variant with the existing force-upgrade events', async () => {
    const { rerender } = render(
      <ExtensionUpdateTakeover promptType="versionUpdate" />,
    );

    await waitFor(() => {
      expect(eventNames()).toContain(
        MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed,
      );
    });
    expect(eventNames()).toEqual([
      MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed,
    ]);

    rerender(<ExtensionUpdateTakeover promptType="unsupportedVersion" />);
    await waitFor(() => {
      expect(eventNames()).toHaveLength(2);
    });

    fireEvent.click(
      screen.getByTestId('extension-update-takeover-update-button'),
    );
    fireEvent.click(
      screen.getByTestId('extension-update-takeover-dismiss-button'),
    );

    expect(mockTrackEvent.mock.calls.map(([event]) => event)).toEqual([
      {
        name: MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed,
        properties: {},
      },
      {
        name: MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed,
        properties: {},
      },
      {
        name: MetaMetricsEventName.ForceUpgradeClickedUpdateToLatestVersion,
        properties: {},
      },
    ]);
  });

  it('sends the update click event before requesting the reload', async () => {
    const order: string[] = [];
    mockTrackEvent.mockImplementation(async (event) => {
      await Promise.resolve();
      order.push(`track:${event.name}`);
    });
    openUpdateTabAndReload.mockImplementation(async () => {
      order.push('reload');
    });

    render(<ExtensionUpdateTakeover promptType="versionUpdate" />);
    await waitFor(() => {
      expect(order).toStrictEqual([
        `track:${MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed}`,
      ]);
    });
    fireEvent.click(
      screen.getByTestId('extension-update-takeover-update-button'),
    );

    await waitFor(() => {
      expect(order).toStrictEqual([
        `track:${MetaMetricsEventName.ForceUpgradeUpdateNeededPromptViewed}`,
        `track:${MetaMetricsEventName.ForceUpgradeClickedUpdateToLatestVersion}`,
        'reload',
      ]);
    });
    expect(rejectAllPendingApprovals).not.toHaveBeenCalled();
  });

  it('rejects pending approvals before reloading from a notification window', async () => {
    const order: string[] = [];
    jest
      .mocked(getEnvironmentType)
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    rejectAllPendingApprovals.mockImplementation(async () => {
      order.push('reject');
    });
    openUpdateTabAndReload.mockImplementation(async () => {
      order.push('reload');
    });

    render(<ExtensionUpdateTakeover promptType="versionUpdate" />);
    fireEvent.click(
      screen.getByTestId('extension-update-takeover-update-button'),
    );

    await waitFor(() => {
      expect(order).toStrictEqual(['reject', 'reload']);
    });
  });

  it('does not reload when rejecting the pending approval fails', async () => {
    jest
      .mocked(getEnvironmentType)
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    rejectAllPendingApprovals.mockRejectedValueOnce(new Error('reject failed'));
    const logError = jest
      .spyOn(log, 'error')
      .mockImplementation(() => undefined);

    render(<ExtensionUpdateTakeover promptType="versionUpdate" />);
    fireEvent.click(
      screen.getByTestId('extension-update-takeover-update-button'),
    );

    await waitFor(() => {
      expect(rejectAllPendingApprovals).toHaveBeenCalledTimes(1);
    });
    expect(openUpdateTabAndReload).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalled();
    logError.mockRestore();
  });
});
