import React from 'react';
import { it } from '@jest/globals';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_POPUP,
} from '#shared/constants/app';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import { AppLayoutProvider } from '../../../contexts/app-layout';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { AppHeader } from './app-header';

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: jest.fn(),
}));
jest.mock('./app-header-unlocked-content', () => ({
  AppHeaderUnlockedContent: ({ isWideLayout }: { isWideLayout: boolean }) => (
    <div
      data-testid="app-header-content"
      data-wide-layout={String(isWideLayout)}
    />
  ),
}));

const mockGetEnvironmentType = jest.mocked(getEnvironmentType);

const renderHeader = (isWideLayout = false) =>
  renderWithProvider(
    <AppLayoutProvider isWideLayout={isWideLayout}>
      <AppHeader />
    </AppLayoutProvider>,
    configureStore(mockState),
  );

describe('AppHeader', () => {
  beforeEach(() => {
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
      const { queryByRole } = renderHeader(true);

      expect(
        queryByRole('link', { name: messages.home.message }),
      ).not.toBeInTheDocument();
    });
  });
});
