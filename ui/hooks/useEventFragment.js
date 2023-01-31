import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getEnvironmentType } from '../../app/scripts/lib/util';
import { selectMatchingFragment } from '../selectors';
import {
  finalizeEventFragment,
  createEventFragment,
  updateEventFragment,
} from '../store/actions';
import { useSegmentContext } from './useSegmentContext';

/**
 * Retrieves a fragment from memory or initializes new fragment if one does not
 * exist. Returns three methods that are tied to the fragment, as well as the
 * fragment id.
 *
 * @param {string} existingId
 * @param {object} fragmentOptions
 * @returns
 */
export function useEventFragment(existingId, fragmentOptions = {}) {
  // To prevent overcalling the createEventFragment background method a ref
  // is used to store a boolean value of whether we have already called the
  // method.
  const createEventFragmentCalled = useRef(false);

  // In order to immediately return a created fragment, instead of waiting for
  // background state to update and find the newly created fragment, we have a
  // state element that is updated with the fragmentId returned from the
  // call into the background process.
  const [createdFragmentId, setCreatedFragmentId] = useState(undefined);

  // Select a matching fragment from state if one exists that matches the
  // criteria. If an existingId is passed in it is preferred, if not and the
  // fragmentOptions has the persist key set to true, a fragment with matching
  // successEvent will be pulled from memory if it exists.
  const fragment = useSelector((state) =>
    selectMatchingFragment(state, {
      fragmentOptions,
      existingId: existingId ?? createdFragmentId,
    }),
  );

  // If no valid existing fragment can be found, a new one must be created that
  // will then be found by the selector above. To do this, invoke the
  // createEventFragment method with the fragmentOptions and current sessionId.
  // As soon as we call the background method we also update the
  // createEventFragmentCalled ref's current value to true so that future calls
  // are suppressed.
  useEffect(() => {
    if (fragment === undefined && createEventFragmentCalled.current === false) {
      createEventFragmentCalled.current = true;
      createEventFragment({
        ...fragmentOptions,
        environmentType: getEnvironmentType(),
      }).then((createdFragment) => {
        setCreatedFragmentId(createdFragment.id);
      });
    }
  }, [fragment, fragmentOptions]);

  const context = useSegmentContext();

  /**
   * trackSuccess is used to close a fragment with the affirmative action. This
   * method is just a thin wrapper around the background method that sets the
   * necessary values.
   */
  const trackSuccess = useCallback(() => {
    finalizeEventFragment(fragment.id, { context });
  }, [fragment, context]);

  /**
   * trackFailure is used to close a fragment as abandoned. This method is just a
   * thin wrapper around the background method that sets the necessary values.
   */
  const trackFailure = useCallback(() => {
    finalizeEventFragment(fragment.id, { abandoned: true, context });
  }, [fragment, context]);

  /**
   * updateEventFragmentProperties is a thin wrapper around updateEventFragment
   * that supplies the fragment id as the first parameter. This function will
   * be passed back from the hook as 'updateEventFragment', but is named
   * updateEventFragmentProperties to avoid naming conflicts.
   */
  const updateEventFragmentProperties = useCallback(
    (payload) => {
      updateEventFragment(fragment.id, payload);
    },
    [fragment],
  );

  return {
    trackSuccess,
    trackFailure,
    updateEventFragment: updateEventFragmentProperties,
    fragment,
  };
}
