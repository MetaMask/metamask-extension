/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { getIsUnlocked } from '../../../ducks/metamask/base-selectors';
import {
  getExtensionUpdatePromptType,
  getIsExtensionUpdatePromptOnAnyRouteEnabled,
} from '../../../selectors/extension-update-prompt';
import {
  selectDisplayUpdateModal,
  selectIsUpdateModalDeferred,
} from '../../../selectors/home-modals';
import { ExtensionUpdateTakeoverContainer } from './extension-update-takeover-container';

let mockPathname = '/';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: mockPathname }),
}));

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({}),
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: jest.fn(),
}));

jest.mock('../../../ducks/metamask/base-selectors', () => ({
  getIsUnlocked: jest.fn(),
}));

jest.mock('../../../selectors/extension-update-prompt', () => ({
  getExtensionUpdatePromptType: jest.fn(),
  getIsExtensionUpdatePromptOnAnyRouteEnabled: jest.fn(),
}));

jest.mock('../../../selectors/home-modals', () => ({
  selectDisplayUpdateModal: jest.fn(),
  selectIsUpdateModalDeferred: jest.fn(),
}));

jest.mock('./extension-update-takeover', () => ({
  ExtensionUpdateTakeover: ({ promptType }: { promptType: string }) => (
    <div data-testid="takeover">{promptType}</div>
  ),
}));

function renderContainer(pathname = '/') {
  mockPathname = pathname;
  return render(<ExtensionUpdateTakeoverContainer />);
}

describe('ExtensionUpdateTakeoverContainer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(getIsUnlocked).mockReturnValue(true);
    jest.mocked(getExtensionUpdatePromptType).mockReturnValue('versionUpdate');
    jest.mocked(selectDisplayUpdateModal).mockReturnValue(true);
    jest.mocked(selectIsUpdateModalDeferred).mockReturnValue(false);
    jest
      .mocked(getIsExtensionUpdatePromptOnAnyRouteEnabled)
      .mockReturnValue(false);
    jest.mocked(getEnvironmentType).mockReturnValue('fullscreen');
  });

  it('renders the prompt variant when it is displayed and nothing defers it', () => {
    jest
      .mocked(getExtensionUpdatePromptType)
      .mockReturnValue('unsupportedVersion');

    renderContainer();

    expect(screen.getByTestId('takeover')).toHaveTextContent(
      'unsupportedVersion',
    );
  });

  it('renders nothing while the wallet is locked', () => {
    jest.mocked(getIsUnlocked).mockReturnValue(false);

    renderContainer();

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('stays hidden while locked when the any-route flag is on', () => {
    jest.mocked(getIsUnlocked).mockReturnValue(false);
    jest
      .mocked(getIsExtensionUpdatePromptOnAnyRouteEnabled)
      .mockReturnValue(true);

    renderContainer('/send');

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing when the update modal is not displayed', () => {
    jest.mocked(selectDisplayUpdateModal).mockReturnValue(false);

    renderContainer();

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing while a flow in progress defers it', () => {
    jest.mocked(selectIsUpdateModalDeferred).mockReturnValue(true);

    renderContainer();

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing when there is no prompt', () => {
    jest.mocked(getExtensionUpdatePromptType).mockReturnValue('none');

    renderContainer();

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing in a notification window', () => {
    jest
      .mocked(getEnvironmentType)
      .mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);

    renderContainer();

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders nothing on a screen where the user is mid flow', () => {
    renderContainer('/send');

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });

  it('renders on a perps browsing screen', () => {
    renderContainer('/perps-home');

    expect(screen.getByTestId('takeover')).toBeInTheDocument();
  });

  it('renders on any route when the any-route flag is on', () => {
    jest
      .mocked(getIsExtensionUpdatePromptOnAnyRouteEnabled)
      .mockReturnValue(true);

    renderContainer('/perps/trade/ETH');

    expect(screen.getByTestId('takeover')).toBeInTheDocument();
  });

  it('still waits for an open dialog when the any-route flag is on', () => {
    jest
      .mocked(getIsExtensionUpdatePromptOnAnyRouteEnabled)
      .mockReturnValue(true);
    jest.mocked(selectIsUpdateModalDeferred).mockReturnValue(true);

    renderContainer('/send');

    expect(screen.queryByTestId('takeover')).not.toBeInTheDocument();
  });
});
