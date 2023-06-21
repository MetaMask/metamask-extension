import React from 'react';
import reactRouterDom, { Route } from 'react-router-dom';
import configureStore from '../../store/store';
import { renderWithProvider } from '../../../test/jest';
import mockState from '../../../test/data/mock-state.json';
import { EXTENSION_ERROR_PAGE_TYPES } from '../../../shared/constants/desktop';
import DesktopErrorPage from '.';

describe('Desktop Error page', () => {
  const mockHistoryPush = jest.fn();

  beforeEach(() => {
    jest
      .spyOn(reactRouterDom, 'useHistory')
      .mockImplementation()
      .mockReturnValue({ push: mockHistoryPush });
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.clearAllMocks();
  });

  it('should render not found page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/${EXTENSION_ERROR_PAGE_TYPES.NOT_FOUND}`],
    );

    expect(container).toMatchSnapshot();
  });

  it('should render connection lost page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/${EXTENSION_ERROR_PAGE_TYPES.CONNECTION_LOST}`],
    );

    expect(container).toMatchSnapshot();
  });

  it('should render desktop app outdated page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/${EXTENSION_ERROR_PAGE_TYPES.DESKTOP_OUTDATED}`],
    );

    expect(container).toMatchSnapshot();
  });

  it('should render extension outdated page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/${EXTENSION_ERROR_PAGE_TYPES.EXTENSION_OUTDATED}`],
    );

    expect(container).toMatchSnapshot();
  });

  it('should render critical error page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/${EXTENSION_ERROR_PAGE_TYPES.CRITICAL_ERROR}`],
    );

    expect(container).toMatchSnapshot();
  });

  it('should render route not found page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/${EXTENSION_ERROR_PAGE_TYPES.ROUTE_NOT_FOUND}`],
    );

    expect(container).toMatchSnapshot();
  });

  it('should render pairing key not match page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/${EXTENSION_ERROR_PAGE_TYPES.PAIRING_KEY_NOT_MATCH}`],
    );

    expect(container).toMatchSnapshot();
  });

  it('should render default error page', async () => {
    const store = configureStore(mockState);
    const { container } = renderWithProvider(
      <Route path="/:errorType">
        <DesktopErrorPage />
      </Route>,
      store,
      [`/unknown-error-type`],
    );

    expect(container).toMatchSnapshot();
  });
});
