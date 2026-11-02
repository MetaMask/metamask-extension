import React from 'react';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '#shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { useFullScreenDesign } from '../../../hooks/useFullScreenDesign';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { AppHeader } from './app-header';

jest.mock('../../../hooks/useFullScreenDesign');
jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));
jest.mock('./app-header-unlocked-content', () => ({
  AppHeaderUnlockedContent: () => <div data-testid="app-header-content" />,
}));

const mockUseFullScreenDesign = jest.mocked(useFullScreenDesign);
const mockGetEnvironmentType = jest.mocked(getEnvironmentType);

const renderHeader = () =>
  renderWithProvider(<AppHeader />, configureStore(mockState));

describe('AppHeader', () => {
  beforeEach(() => {
    mockUseFullScreenDesign.mockReturnValue(false);
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
  });

  it('renders the header content', () => {
    const { getByTestId } = renderHeader();

    expect(getByTestId('app-header-content')).toBeInTheDocument();
  });

  describe('logo', () => {
    it('is shown in the legacy fullscreen view', () => {
      const { getByRole } = renderHeader();

      expect(
        getByRole('link', { name: messages.home.message }),
      ).toBeInTheDocument();
    });

    it('is hidden outside of fullscreen', () => {
      mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);

      const { queryByRole } = renderHeader();

      expect(
        queryByRole('link', { name: messages.home.message }),
      ).not.toBeInTheDocument();
    });

    it('is hidden in the new fullscreen design', () => {
      mockUseFullScreenDesign.mockReturnValue(true);

      const { queryByRole } = renderHeader();

      expect(
        queryByRole('link', { name: messages.home.message }),
      ).not.toBeInTheDocument();
    });
  });
});
