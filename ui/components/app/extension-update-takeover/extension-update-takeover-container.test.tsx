/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  getExtensionUpdatePromptType,
  getIsExtensionUpdatePromptOnNotificationEnabled,
} from '../../../selectors/extension-update-prompt';
import {
  selectDisplayUpdateModal,
  selectIsUpdateModalDeferred,
  selectIsUpdateModalDeferredByOpenFlow,
} from '../../../selectors/home-modals';
import { ExtensionUpdateTakeoverContainer } from './extension-update-takeover-container';

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../selectors/extension-update-prompt', () => ({
  getExtensionUpdatePromptType: jest.fn(),
  getIsExtensionUpdatePromptOnNotificationEnabled: jest.fn(),
}));

jest.mock('../../../selectors/home-modals', () => ({
  selectDisplayUpdateModal: jest.fn(),
  selectIsUpdateModalDeferred: jest.fn(),
  selectIsUpdateModalDeferredByOpenFlow: jest.fn(),
}));

jest.mock('./extension-update-takeover', () => ({
  ExtensionUpdateTakeover: ({ promptType }: { promptType: string }) => (
    <div data-testid="takeover">{promptType}</div>
  ),
}));

describe('ExtensionUpdateTakeoverContainer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getExtensionUpdatePromptType).mockReturnValue('versionUpdate');
    jest.mocked(selectDisplayUpdateModal).mockReturnValue(true);
    jest.mocked(selectIsUpdateModalDeferred).mockReturnValue(false);
    jest.mocked(selectIsUpdateModalDeferredByOpenFlow).mockReturnValue(false);
    jest
      .mocked(getIsExtensionUpdatePromptOnNotificationEnabled)
      .mockReturnValue(false);
    jest.mocked(getEnvironmentType).mockReturnValue('fullscreen');
  });

  it('renders the prompt variant when it is displayed and nothing defers it', () => {
    jest
      .mocked(getExtensionUpdatePromptType)
      .mockReturnValue('unsupportedVersion');

    render(<ExtensionUpdateTakeoverContainer />);

    expect(screen.getByTestId('takeover')).toHaveTextContent(
      'unsupportedVersion',
    );
  });

  it('renders nothing when the update modal is not displayed', () => {
    jest.mocked(selectDisplayUpdateModal).mockReturnValue(false);

    render(<ExtensionUpdateTakeoverContainer />);

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing while a flow in progress defers it', () => {
    jest.mocked(selectIsUpdateModalDeferred).mockReturnValue(true);

    render(<ExtensionUpdateTakeoverContainer />);

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no prompt', () => {
    jest.mocked(getExtensionUpdatePromptType).mockReturnValue('none');

    render(<ExtensionUpdateTakeoverContainer />);

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing in a notification window when the flag is off', () => {
    jest
      .mocked(getEnvironmentType)
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    jest.mocked(selectIsUpdateModalDeferred).mockReturnValue(true);

    render(<ExtensionUpdateTakeoverContainer />);

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('covers a notification confirmation when the flag is exactly enabled', () => {
    jest
      .mocked(getEnvironmentType)
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    jest
      .mocked(getIsExtensionUpdatePromptOnNotificationEnabled)
      .mockReturnValue(true);
    jest.mocked(selectIsUpdateModalDeferred).mockReturnValue(true);

    render(<ExtensionUpdateTakeoverContainer />);

    expect(screen.getByTestId('takeover')).toHaveTextContent('versionUpdate');
  });

  it('still waits for an open dialog in a notification window', () => {
    jest
      .mocked(getEnvironmentType)
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    jest
      .mocked(getIsExtensionUpdatePromptOnNotificationEnabled)
      .mockReturnValue(true);
    jest.mocked(selectIsUpdateModalDeferredByOpenFlow).mockReturnValue(true);

    render(<ExtensionUpdateTakeoverContainer />);

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });
});
