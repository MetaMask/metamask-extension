import { useCallback } from 'react';
import { useSelector } from 'react-redux';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../app/scripts/lib/util';
import {
  selectFragmentById,
  selectFragmentBySuccessEvent,
} from '../selectors/metametrics';
import { updateEventFragment } from '../store/actions';
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
  // Select a matching fragment from state if one exists that matches the
  // criteria. If an existingId is passed in it is preferred, if not and the
  // fragmentOptions has the persist key set to true, a fragment with matching
  // successEvent will be pulled from memory if it exists.
  const fragment = useSelector((state) => {
    const fragmentById = selectFragmentById(state, existingId);
    if (fragmentById) {
      return fragmentById;
    }
    return selectFragmentBySuccessEvent(state, fragmentOptions);
  });

  const context = useSegmentContext();

  /**
   * trackSuccess is used to close a fragment with the affirmative action. This
   * method is just a thin wrapper around the background method that sets the
   * necessary values.
   */
  const trackSuccess = useCallback(() => {
    if (!fragment?.id) {
      return;
    }
    updateEventFragment(fragment.id, {
      context,
      environmentType: getEnvironmentType(),
      abandoned: false,
    });
  }, [fragment, context]);

  /**
   * trackFailure is used to close a fragment as abandoned. This method is just a
   * thin wrapper around the background method that sets the necessary values.
   */
  const trackFailure = useCallback(() => {
    if (!fragment?.id) {
      return;
    }
    updateEventFragment(fragment.id, {
      abandoned: true,
      context,
      environmentType: getEnvironmentType(),
    });
  }, [fragment, context]);

  /**
   * updateEventFragmentProperties is a thin wrapper around updateEventFragment
   * that supplies the fragment id as the first parameter. This function will
   * be passed back from the hook as 'updateEventFragment', but is named
   * updateEventFragmentProperties to avoid naming conflicts.
   */
  const updateEventFragmentProperties = useCallback(
    (payload) => {
      if (!fragment?.id) {
        return;
      }
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
