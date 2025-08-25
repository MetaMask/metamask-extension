import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom-v5-compat';
import withRouterHooks, { RouterHooksProps } from './with-router-hooks';

// Mock the react-router-dom-v5-compat hooks
const mockNavigate = jest.fn();
const mockLocation = { pathname: '/test', search: '', hash: '', state: null };
const mockParams = { id: 'test-id' };

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
  useParams: () => mockParams,
}));

type BaseTestComponentProps = {
  testProp?: string;
};

type TestComponentProps = BaseTestComponentProps & RouterHooksProps;

const TestComponent: React.FC<TestComponentProps> = ({
  navigate,
  location,
  params,
  testProp,
}) => (
  <div>
    <div data-testid="test-prop">{testProp}</div>
    <div data-testid="pathname">{location?.pathname}</div>
    <div data-testid="param-id">{(params as Record<string, string>)?.id}</div>
    <button
      data-testid="navigate-button"
      onClick={() => navigate('/new-route')}
    >
      Navigate
    </button>
  </div>
);

describe('withRouterHooks HOC', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('wraps component and provides router hooks as props', () => {
    const WrappedComponent = withRouterHooks(TestComponent);
    const { getByTestId } = render(
      <MemoryRouter>
        <WrappedComponent testProp="test-value" />
      </MemoryRouter>,
    );
    expect(getByTestId('test-prop')).toHaveTextContent('test-value');
    expect(getByTestId('pathname')).toHaveTextContent('/test');
    expect(getByTestId('param-id')).toHaveTextContent('test-id');
  });

  it('passes navigate function that can be called', () => {
    const WrappedComponent = withRouterHooks(TestComponent);
    const { getByTestId } = render(
      <MemoryRouter>
        <WrappedComponent />
      </MemoryRouter>,
    );
    getByTestId('navigate-button').click();
    expect(mockNavigate).toHaveBeenCalledWith('/new-route');
  });

  it('sets correct displayName for debugging', () => {
    const testComponentWithDisplayName: React.FC<TestComponentProps> = (
      props,
    ) => <div>{props.testProp}</div>;
    testComponentWithDisplayName.displayName = 'TestComponentWithDisplayName';
    const WrappedComponent = withRouterHooks(testComponentWithDisplayName);
    expect(WrappedComponent.displayName).toBe(
      'withRouterHooks(TestComponentWithDisplayName)',
    );
  });

  it('handles component without displayName or name', () => {
    const anonymousComponent: React.FC<TestComponentProps> = () => (
      <div>Anonymous</div>
    );
    // Explicitly set the name property to empty string to simulate anonymous function
    Object.defineProperty(anonymousComponent, 'name', { value: '' });
    const WrappedComponent = withRouterHooks(anonymousComponent);
    expect(WrappedComponent.displayName).toBe('withRouterHooks(Component)');
  });

  it('uses component name when displayName is not available', () => {
    const namedComponent: React.FC<TestComponentProps> = () => <div>Test</div>;
    const WrappedComponent = withRouterHooks(namedComponent);
    expect(WrappedComponent.displayName).toBe(
      'withRouterHooks(namedComponent)',
    );
  });

  it('provides all router hooks (navigate, location, params)', () => {
    const TestComponentForHooks: React.FC<RouterHooksProps> = ({
      navigate,
      location,
      params,
    }) => {
      expect(typeof navigate).toBe('function');
      expect(typeof location).toBe('object');
      expect(typeof params).toBe('object');
      return <div>All hooks provided</div>;
    };
    const WrappedComponent = withRouterHooks(TestComponentForHooks);
    render(
      <MemoryRouter>
        <WrappedComponent />
      </MemoryRouter>,
    );
  });
});
