import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation, useParams } from 'react-router-dom';
import withRouterHooks, { RouterHooksProps } from './with-router-hooks';

// Mock the react-router-dom hooks
const mockUseNavigate = jest.fn();
const mockUseLocation = {
  pathname: '/test',
  search: '',
  hash: '',
  state: null,
};
const mockUseParams = { id: 'test-id' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => mockUseLocation,
  useParams: () => mockUseParams,
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
    expect(mockUseNavigate).toHaveBeenCalledWith('/new-route');
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

  describe('memoization behavior', () => {
    it('maintains stable params reference when values are unchanged', () => {
      const paramsReferences: ReturnType<typeof useParams>[] = [];

      const TestComponentForMemo: React.FC<
        TestComponentProps & { renderCount?: number }
      > = ({ params }) => {
        paramsReferences.push(params);
        return <div>Memoization test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = render(
        <MemoryRouter>
          <WrappedComponent renderCount={1} />
        </MemoryRouter>,
      );

      // Force re-render with different prop
      rerender(
        <MemoryRouter>
          <WrappedComponent renderCount={2} />
        </MemoryRouter>,
      );

      // Params should be the same reference on both renders
      expect(paramsReferences).toHaveLength(2);
      expect(paramsReferences[0]).toBe(paramsReferences[1]);
    });

    it('maintains stable location reference when values are unchanged', () => {
      const locationReferences: ReturnType<typeof useLocation>[] = [];

      const TestComponentForMemo: React.FC<
        TestComponentProps & { renderCount?: number }
      > = ({ location }) => {
        locationReferences.push(location);
        return <div>Memoization test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = render(
        <MemoryRouter>
          <WrappedComponent renderCount={1} />
        </MemoryRouter>,
      );

      // Force re-render with different prop
      rerender(
        <MemoryRouter>
          <WrappedComponent renderCount={2} />
        </MemoryRouter>,
      );

      // Location should be the same reference on both renders
      expect(locationReferences).toHaveLength(2);
      expect(locationReferences[0]).toBe(locationReferences[1]);
    });

    it('respects passed-in params prop over hook value', () => {
      const customParams = { customId: 'custom-value' };
      const paramsReceived: ReturnType<typeof useParams>[] = [];

      const TestComponentForMemo: React.FC<TestComponentProps> = ({
        params,
      }) => {
        paramsReceived.push(params);
        return <div>Custom params test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      render(
        <MemoryRouter>
          <WrappedComponent params={customParams} />
        </MemoryRouter>,
      );

      expect(paramsReceived[0]).toBe(customParams);
    });

    it('respects passed-in location prop over hook value', () => {
      const customLocation = {
        pathname: '/custom',
        search: '?custom=true',
        hash: '#custom',
        state: { custom: true },
        key: 'custom-key',
      };
      const locationsReceived: ReturnType<typeof useLocation>[] = [];

      const TestComponentForMemo: React.FC<TestComponentProps> = ({
        location,
      }) => {
        locationsReceived.push(location);
        return <div>Custom location test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      render(
        <MemoryRouter>
          <WrappedComponent location={customLocation} />
        </MemoryRouter>,
      );

      expect(locationsReceived[0]).toBe(customLocation);
    });
  });
});
