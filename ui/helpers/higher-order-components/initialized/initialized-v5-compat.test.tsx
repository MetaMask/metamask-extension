import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat';
import configureStore from 'redux-mock-store';
import { ONBOARDING_ROUTE } from '../../constants/routes';
import InitializedV5Compat from './initialized-v5-compat';

jest.mock('../../../ducks/metamask/metamask', () => ({
  getCompletedOnboarding: (state: {
    metamask: { completedOnboarding: boolean };
  }) => state.metamask.completedOnboarding,
}));

const mockStore = configureStore();

describe('InitializedV5Compat', () => {
  const MockChildComponent = () => (
    <div data-testid="child-component">Child Component</div>
  );
  const MockOnboardingComponent = () => (
    <div data-testid="onboarding">Onboarding Page</div>
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when onboarding is completed', () => {
    const store = mockStore({
      metamask: {
        completedOnboarding: true,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test-route']}>
          <Routes>
            <Route
              path="/test-route"
              element={
                <InitializedV5Compat>
                  <MockChildComponent />
                </InitializedV5Compat>
              }
            />
            <Route
              path={ONBOARDING_ROUTE}
              element={<MockOnboardingComponent />}
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByTestId('child-component')).toBeInTheDocument();
    expect(screen.getByText('Child Component')).toBeInTheDocument();
    expect(screen.queryByTestId('onboarding')).not.toBeInTheDocument();
  });

  it('should redirect to onboarding route when onboarding is not completed', () => {
    const store = mockStore({
      metamask: {
        completedOnboarding: false,
      },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test-route']}>
          <Routes>
            <Route
              path="/test-route"
              element={
                <InitializedV5Compat>
                  <MockChildComponent />
                </InitializedV5Compat>
              }
            />
            <Route
              path={ONBOARDING_ROUTE}
              element={<MockOnboardingComponent />}
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
    expect(screen.getByTestId('onboarding')).toBeInTheDocument();
    expect(screen.getByText('Onboarding Page')).toBeInTheDocument();
  });

  it('should accept and render complex React node structures as children', () => {
    const store = mockStore({
      metamask: {
        completedOnboarding: true,
      },
    });

    const NestedComponent = () => (
      <span data-testid="nested">Nested Content</span>
    );

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/test-route']}>
          <Routes>
            <Route
              path="/test-route"
              element={
                <InitializedV5Compat>
                  <div data-testid="parent">
                    <NestedComponent />
                    <p data-testid="paragraph">Some text</p>
                  </div>
                </InitializedV5Compat>
              }
            />
            <Route
              path={ONBOARDING_ROUTE}
              element={<MockOnboardingComponent />}
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByTestId('parent')).toBeInTheDocument();
    expect(screen.getByTestId('nested')).toBeInTheDocument();
    expect(screen.getByTestId('paragraph')).toBeInTheDocument();
    expect(screen.getByText('Nested Content')).toBeInTheDocument();
    expect(screen.getByText('Some text')).toBeInTheDocument();
  });
});
