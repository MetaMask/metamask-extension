import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, useLocation, useParams } from 'react-router-dom';
import withRouterHooks, { RouterHooksProps } from './with-router-hooks';

// Mock the react-router-dom hooks
const mockUseNavigate = jest.fn();
let mockLocationKey = 'default-key';
const getMockUseLocation = () => ({
  pathname: '/test',
  search: '',
  hash: '',
  state: null,
  key: mockLocationKey,
});

// Track current params values - returns NEW object each call to test memoization
let mockParamsValues: Record<string, string> = { id: 'test-id' };
const getMockUseParams = () => ({ ...mockParamsValues });

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockUseNavigate,
  useLocation: () => getMockUseLocation(),
  useParams: () => getMockUseParams(),
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
    mockLocationKey = 'default-key';
    mockParamsValues = { id: 'test-id' };
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
      // Note: getMockUseParams() returns a NEW object each call, so this test
      // verifies that useShallowEqualityCheck stabilizes references when values match
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

      // Force re-render with different prop - getMockUseParams() returns new object
      rerender(
        <MemoryRouter>
          <WrappedComponent renderCount={2} />
        </MemoryRouter>,
      );

      // Params should be the same reference on both renders despite mock returning new objects
      expect(paramsReferences).toHaveLength(2);
      expect(paramsReferences[0]).toBe(paramsReferences[1]);
    });

    it('updates params reference when values change', () => {
      // Complementary test: verify memoization correctly detects value changes
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

      // Change params values
      mockParamsValues = { id: 'different-id' };

      rerender(
        <MemoryRouter>
          <WrappedComponent renderCount={2} />
        </MemoryRouter>,
      );

      // Params should be different references when values change
      expect(paramsReferences).toHaveLength(2);
      expect(paramsReferences[0]).toEqual({ id: 'test-id' });
      expect(paramsReferences[1]).toEqual({ id: 'different-id' });
      expect(paramsReferences[0]).not.toBe(paramsReferences[1]);
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

    it('correctly distinguishes params with comma-containing values (no memoization collision)', () => {
      // This test verifies the fix for the memoization collision bug where
      // { a: 'x,y', b: 'z' } and { a: 'x', b: 'y,z' } would both produce
      // the same comma-joined string 'x,y,z' with naive serialization.
      // We change the mock values (not props) to exercise useShallowEqualityCheck.
      const paramsReceived: ReturnType<typeof useParams>[] = [];

      const TestComponentForMemo: React.FC<
        TestComponentProps & { renderCount?: number }
      > = ({ params }) => {
        paramsReceived.push(params);
        return <div>Comma collision test</div>;
      };

      // Set up first params with comma in 'a' value
      mockParamsValues = { a: 'x,y', b: 'z' };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = render(
        <MemoryRouter>
          <WrappedComponent renderCount={1} />
        </MemoryRouter>,
      );

      // Change to different params that would collide with naive comma-join
      mockParamsValues = { a: 'x', b: 'y,z' };

      rerender(
        <MemoryRouter>
          <WrappedComponent renderCount={2} />
        </MemoryRouter>,
      );

      // Verify that the params are different references (memoization detected the change)
      expect(paramsReceived).toHaveLength(2);
      expect(paramsReceived[0]).toEqual({ a: 'x,y', b: 'z' });
      expect(paramsReceived[1]).toEqual({ a: 'x', b: 'y,z' });
      expect(paramsReceived[0]).not.toBe(paramsReceived[1]);
    });

    it('maintains stable location reference when only key changes (same-path navigation)', () => {
      // This test verifies that location.key changes don't cause unnecessary re-renders.
      // React Router changes key on every navigation, even to the same path.
      const locationsReceived: ReturnType<typeof useLocation>[] = [];

      const TestComponentForMemo: React.FC<
        TestComponentProps & { renderCount?: number }
      > = ({ location }) => {
        locationsReceived.push(location);
        return <div>Location key test</div>;
      };

      // Start with key-1
      mockLocationKey = 'key-1';

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = render(
        <MemoryRouter>
          <WrappedComponent renderCount={1} />
        </MemoryRouter>,
      );

      // Change key to simulate same-path navigation (key changes, path stays same)
      mockLocationKey = 'key-2';

      rerender(
        <MemoryRouter>
          <WrappedComponent renderCount={2} />
        </MemoryRouter>,
      );

      // Location should be the same reference because only key changed
      // (pathname, search, hash, state are all the same)
      expect(locationsReceived).toHaveLength(2);
      expect(locationsReceived[0]).toBe(locationsReceived[1]);
    });
  });
});
