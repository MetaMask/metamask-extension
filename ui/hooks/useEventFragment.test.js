import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import {
  finalizeEventFragment,
  createEventFragment,
  updateEventFragment,
} from '../store/actions';
import { useEventFragment } from './useEventFragment';

jest.mock('../store/actions', () => ({
  finalizeEventFragment: jest.fn(),
  updateEventFragment: jest.fn(),
  createEventFragment: jest.fn(),
}));

jest.mock('./useSegmentContext', () => ({
  useSegmentContext: jest.fn(() => ({ page: '/' })),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('useEventFragment', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('return shape', () => {
    let value;
    beforeAll(async () => {
      useSelector.mockImplementation((selector) =>
        selector({ metamask: { fragments: { testid: { id: 'testid' } } } }),
      );
      createEventFragment.mockImplementation(() =>
        Promise.resolve({
          id: 'testid',
        }),
      );
      const { result, waitForNextUpdate } = renderHook(() =>
        useEventFragment(undefined, {
          successEvent: 'success',
          failureEvent: 'failure',
          persist: true,
        }),
      );
      await waitForNextUpdate();
      value = result.current;
    });

    it('should have trackSuccess method', () => {
      expect(value).toHaveProperty('trackSuccess');
      expect(typeof value.trackSuccess).toBe('function');
    });

    it('should have trackFailure method', () => {
      expect(value).toHaveProperty('trackFailure');
      expect(typeof value.trackFailure).toBe('function');
    });

    it('should have updateEventFragment method', () => {
      expect(value).toHaveProperty('updateEventFragment');
      expect(typeof value.updateEventFragment).toBe('function');
    });

    it('should have fragment property', () => {
      expect(value).toHaveProperty('fragment');
      expect(value.fragment).toMatchObject({
        id: 'testid',
      });
    });
  });

  describe('identifying appropriate fragment', () => {
    it('should create a new fragment when a matching fragment does not exist', async () => {
      useSelector.mockImplementation((selector) =>
        selector({
          metamask: {
            fragments: {
              testid: {
                id: 'testid',
                successEvent: 'success',
                failureEvent: 'failure',
              },
            },
          },
        }),
      );
      createEventFragment.mockImplementation(() =>
        Promise.resolve({
          id: 'testid',
        }),
      );
      const { result, waitForNextUpdate } = renderHook(() =>
        useEventFragment(undefined, {
          successEvent: 'success',
          failureEvent: 'failure',
        }),
      );
      await waitForNextUpdate();
      expect(createEventFragment).toHaveBeenCalledTimes(1);
      const returnValue = result.current;
      expect(returnValue.fragment).toMatchObject({
        id: 'testid',
        successEvent: 'success',
        failureEvent: 'failure',
      });
    });

    it('should return the matching fragment by id when existingId is provided', async () => {
      useSelector.mockImplementation((selector) =>
        selector({
          metamask: {
            fragments: {
              testid: {
                id: 'testid',
                successEvent: 'success',
                failureEvent: 'failure',
              },
            },
          },
        }),
      );
      const { result } = renderHook(() =>
        useEventFragment('testid', {
          successEvent: 'success',
          failureEvent: 'failure',
        }),
      );
      const returnValue = result.current;
      expect(returnValue.fragment).toMatchObject({
        id: 'testid',
        successEvent: 'success',
        failureEvent: 'failure',
      });
    });

    it('should return matching fragment by successEvent when no id is provided, but persist is true', async () => {
      useSelector.mockImplementation((selector) =>
        selector({
          metamask: {
            fragments: {
              testid: {
                persist: true,
                id: 'testid',
                successEvent: 'track new event',
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
      const returnValue = result.current;
      expect(returnValue.fragment).toMatchObject({
        id: 'testid',
        persist: true,
        successEvent: 'track new event',
      });
    });
  });

  describe('methods', () => {
    let value;
    beforeAll(async () => {
      useSelector.mockImplementation((selector) =>
        selector({ metamask: { fragments: { testid: { id: 'testid' } } } }),
      );
      createEventFragment.mockImplementation(() =>
        Promise.resolve({
          id: 'testid',
        }),
      );
      const { result, waitForNextUpdate } = renderHook(() =>
        useEventFragment(undefined, {
          successEvent: 'success',
          failureEvent: 'failure',
          persist: true,
        }),
      );
      await waitForNextUpdate();
      value = result.current;
    });

    it('trackSuccess method should invoke the background finalizeEventFragment method', () => {
      value.trackSuccess();
      expect(finalizeEventFragment).toHaveBeenCalledWith('testid', {
        context: { page: '/' },
      });
    });

    it('trackFailure method should invoke the background finalizeEventFragment method', () => {
      value.trackFailure();
      expect(finalizeEventFragment).toHaveBeenCalledWith('testid', {
        abandoned: true,
        context: { page: '/' },
      });
    });

    it('updateEventFragment method should invoke the background updateEventFragment method', () => {
      value.updateEventFragment({ properties: { count: 1 } });
      expect(updateEventFragment).toHaveBeenCalledWith('testid', {
        properties: { count: 1 },
      });
    });
  });
});
