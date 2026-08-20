import React from 'react';
import { render } from '@testing-library/react';
import { useLocation, useParams } from 'react-router-dom';
import { createMemoryRouterWrapper } from '../../../../test/lib/render-helpers-navigate';
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

type TestComponentProps = RouterHooksProps;

const TestComponent = ({
  navigate,
  location,
  params,
  testProp,
}: TestComponentProps & { testProp?: string }) => (
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
  const renderWithRouter = (ui: React.ReactElement) => {
    const wrapper = createMemoryRouterWrapper({ initialEntries: ['/'] });
    return render(ui, { wrapper });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocationKey = 'default-key';
    mockParamsValues = { id: 'test-id' };
  });

  it('wraps component and provides router hooks as props', () => {
    const WrappedComponent = withRouterHooks(TestComponent);
    const { getByTestId } = renderWithRouter(
      <WrappedComponent testProp="test-value" />,
    );
    expect(getByTestId('test-prop')).toHaveTextContent('test-value');
    expect(getByTestId('pathname')).toHaveTextContent('/test');
    expect(getByTestId('param-id')).toHaveTextContent('test-id');
  });

  it('passes navigate function that can be called', () => {
    const WrappedComponent = withRouterHooks(TestComponent);
    const { getByTestId } = renderWithRouter(<WrappedComponent />);
    getByTestId('navigate-button').click();
    expect(mockUseNavigate).toHaveBeenCalledWith('/new-route');
  });

  it('sets correct displayName for debugging', () => {
    const testComponentWithDisplayName = (props: TestComponentProps) => (
      <div>{props.navigate?.toString()}</div>
    );
    testComponentWithDisplayName.displayName = 'TestComponentWithDisplayName';
    const WrappedComponent = withRouterHooks(testComponentWithDisplayName);
    expect(WrappedComponent.displayName).toBe(
      'withRouterHooks(TestComponentWithDisplayName)',
    );
  });

  it('handles component without displayName or name', () => {
    const anonymousComponent = () => <div>Anonymous</div>;
    // Explicitly set the name property to empty string to simulate anonymous function
    Object.defineProperty(anonymousComponent, 'name', { value: '' });
    const WrappedComponent = withRouterHooks(anonymousComponent);
    expect(WrappedComponent.displayName).toBe('withRouterHooks(Component)');
  });

  it('uses component name when displayName is not available', () => {
    const namedComponent = () => <div>Test</div>;
    const WrappedComponent = withRouterHooks(namedComponent);
    expect(WrappedComponent.displayName).toBe(
      'withRouterHooks(namedComponent)',
    );
  });

  it('provides all router hooks (navigate, location, params)', () => {
    const TestComponentForHooks = ({
      navigate,
      location,
      params,
    }: RouterHooksProps) => {
      expect(typeof navigate).toBe('function');
      expect(typeof location).toBe('object');
      expect(typeof params).toBe('object');
      return <div>All hooks provided</div>;
    };
    const WrappedComponent = withRouterHooks(TestComponentForHooks);
    renderWithRouter(<WrappedComponent />);
  });

  describe('memoization behavior', () => {
    it('maintains stable params reference when values are unchanged', () => {
      // Note: getMockUseParams() returns a NEW object each call, so this test
      // verifies that useShallowEqualityCheck stabilizes references when values match
      const paramsReferences: ReturnType<typeof useParams>[] = [];

      const TestComponentForMemo = ({ params }: TestComponentProps) => {
        paramsReferences.push(params);
        return <div>Memoization test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = renderWithRouter(<WrappedComponent />);

      // Force re-render with different prop - getMockUseParams() returns new object
      rerender(<WrappedComponent />);

      // Params should be the same reference on both renders despite mock returning new objects
      expect(paramsReferences.length).toBeGreaterThanOrEqual(2);
      expect(paramsReferences.at(-1)).toBe(paramsReferences.at(-2));
    });

    it('updates params reference when values change', () => {
      // Complementary test: verify memoization correctly detects value changes
      const paramsReferences: ReturnType<typeof useParams>[] = [];

      const TestComponentForMemo = ({ params }: TestComponentProps) => {
        paramsReferences.push(params);
        return <div>Memoization test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = renderWithRouter(<WrappedComponent />);

      // Change params values
      mockParamsValues = { id: 'different-id' };

      rerender(<WrappedComponent />);

      // Params should be different references when values change
      expect(paramsReferences.length).toBeGreaterThanOrEqual(2);
      expect(paramsReferences[0]).toEqual({ id: 'test-id' });
      expect(paramsReferences.at(-1)).toEqual({ id: 'different-id' });
      expect(paramsReferences.at(-1)).not.toBe(paramsReferences[0]);
    });

    it('maintains stable location reference when values are unchanged', () => {
      const locationReferences: ReturnType<typeof useLocation>[] = [];

      const TestComponentForMemo = ({ location }: TestComponentProps) => {
        locationReferences.push(location);
        return <div>Memoization test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = renderWithRouter(<WrappedComponent />);

      // Force re-render with different prop
      rerender(<WrappedComponent />);

      // Location should be the same reference on both renders
      expect(locationReferences.length).toBeGreaterThanOrEqual(2);
      expect(locationReferences.at(-1)).toBe(locationReferences.at(-2));
    });

    it('respects passed-in params prop over hook value', () => {
      const customParams = { customId: 'custom-value' };
      const paramsReceived: ReturnType<typeof useParams>[] = [];

      const TestComponentForMemo = ({ params }: TestComponentProps) => {
        paramsReceived.push(params);
        return <div>Custom params test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      renderWithRouter(<WrappedComponent params={customParams} />);

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

      const TestComponentForMemo = ({ location }: TestComponentProps) => {
        locationsReceived.push(location);
        return <div>Custom location test</div>;
      };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      renderWithRouter(<WrappedComponent location={customLocation} />);

      expect(locationsReceived[0]).toBe(customLocation);
    });

    it('correctly distinguishes params with comma-containing values (no memoization collision)', () => {
      // This test verifies the fix for the memoization collision bug where
      // { a: 'x,y', b: 'z' } and { a: 'x', b: 'y,z' } would both produce
      // the same comma-joined string 'x,y,z' with naive serialization.
      // We change the mock values (not props) to exercise useShallowEqualityCheck.
      const paramsReceived: ReturnType<typeof useParams>[] = [];

      const TestComponentForMemo = ({ params }: TestComponentProps) => {
        paramsReceived.push(params);
        return <div>Comma collision test</div>;
      };

      // Set up first params with comma in 'a' value
      mockParamsValues = { a: 'x,y', b: 'z' };

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = renderWithRouter(<WrappedComponent />);

      // Change to different params that would collide with naive comma-join
      mockParamsValues = { a: 'x', b: 'y,z' };

      rerender(<WrappedComponent />);

      // Verify that the params are different references (memoization detected the change)
      expect(paramsReceived.length).toBeGreaterThanOrEqual(2);
      expect(paramsReceived[0]).toEqual({ a: 'x,y', b: 'z' });
      expect(paramsReceived.at(-1)).toEqual({ a: 'x', b: 'y,z' });
      expect(paramsReceived.at(-1)).not.toBe(paramsReceived[0]);
    });

    it('maintains stable location reference when only key changes (same-path navigation)', () => {
      // This test verifies that location.key changes don't cause unnecessary re-renders.
      // React Router changes key on every navigation, even to the same path.
      const locationsReceived: ReturnType<typeof useLocation>[] = [];

      const TestComponentForMemo = ({ location }: TestComponentProps) => {
        locationsReceived.push(location);
        return <div>Location key test</div>;
      };

      // Start with key-1
      mockLocationKey = 'key-1';

      const WrappedComponent = withRouterHooks(TestComponentForMemo);
      const { rerender } = renderWithRouter(<WrappedComponent />);

      // Change key to simulate same-path navigation (key changes, path stays same)
      mockLocationKey = 'key-2';

      rerender(<WrappedComponent />);

      // Location should be the same reference because only key changed
      // (pathname, search, hash, state are all the same)
      expect(locationsReceived.length).toBeGreaterThanOrEqual(2);
      expect(locationsReceived.at(-1)).toBe(locationsReceived.at(-2));
    });
  });
});
