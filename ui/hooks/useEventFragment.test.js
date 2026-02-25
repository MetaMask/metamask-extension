import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { updateEventFragment } from '../store/actions';
import { useEventFragment } from './useEventFragment';

jest.mock('../store/actions', () => ({
  updateEventFragment: jest.fn(),
}));

jest.mock('./useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({ page: '/' })),
}));

jest.mock('../../app/scripts/lib/util', () => ({
  getEnvironmentType: jest.fn(() => 'mockEnvironment'),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

describe('useEventFragment', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the expected shape', () => {
    useSelector.mockImplementation((selector) =>
      selector({
        metamask: {
          fragments: {
            testid: {
              id: 'testid',
              successEvent: 'success',
              failureEvent: 'failure',
              persist: true,
            },
          },
        },
      }),
    );

    const { result } = renderHook(() =>
      useEventFragment('testid', {
        successEvent: 'success',
        failureEvent: 'failure',
        persist: true,
      }),
    );

    expect(result.current).toHaveProperty('trackSuccess');
    expect(result.current).toHaveProperty('trackFailure');
    expect(result.current).toHaveProperty('updateEventFragment');
    expect(result.current).toHaveProperty('fragment');
    expect(result.current.fragment).toMatchObject({ id: 'testid' });
  });

  it('selects matching fragment by success event when id is not provided', () => {
    useSelector.mockImplementation((selector) =>
      selector({
        metamask: {
          fragments: {
            testid: {
              id: 'testid',
              successEvent: 'track new event',
              persist: true,
            },
          },
        },
      }),
    );

    const { result } = renderHook(() =>
      useEventFragment(undefined, {
        successEvent: 'track new event',
        persist: true,
      }),
    );

    expect(result.current.fragment).toMatchObject({
      id: 'testid',
      successEvent: 'track new event',
      persist: true,
    });
  });

  it('trackSuccess updates fragment with success payload', () => {
    useSelector.mockImplementation((selector) =>
      selector({ metamask: { fragments: { testid: { id: 'testid' } } } }),
    );

    const { result } = renderHook(() => useEventFragment('testid'));

    result.current.trackSuccess();

    expect(updateEventFragment).toHaveBeenCalledWith('testid', {
      abandoned: false,
      context: { page: '/' },
      environmentType: 'mockEnvironment',
    });
  });

  it('trackFailure updates fragment with abandoned payload', () => {
    useSelector.mockImplementation((selector) =>
      selector({ metamask: { fragments: { testid: { id: 'testid' } } } }),
    );

    const { result } = renderHook(() => useEventFragment('testid'));

    result.current.trackFailure();

    expect(updateEventFragment).toHaveBeenCalledWith('testid', {
      abandoned: true,
      context: { page: '/' },
      environmentType: 'mockEnvironment',
    });
  });

  it('updateEventFragment forwards payload to action', () => {
    useSelector.mockImplementation((selector) =>
      selector({ metamask: { fragments: { testid: { id: 'testid' } } } }),
    );

    const { result } = renderHook(() => useEventFragment('testid'));

    result.current.updateEventFragment({ properties: { count: 1 } });

    expect(updateEventFragment).toHaveBeenCalledWith('testid', {
      properties: { count: 1 },
    });
  });
});
