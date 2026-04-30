import type { RequestSnapsParams } from '@metamask/snaps-sdk';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { useMessenger } from '../../../../hooks/useMessenger';
import type { RouteMessengerInstance } from '../messenger';
import { forceUpdateMetamaskState } from '../../../../store/actions';
import { getFirstSnapInstallOrUpdateRequest } from '../../../../selectors';

type UpdateFunction = (snaps: RequestSnapsParams) => void;

/**
 * Hook to update a Snap by calling the `SnapController:installSnaps` method on
 * the messenger.
 *
 * @returns A tuple containing the update function and the approval ID of the
 * Snap update request, which can be used for navigating to the approval flow.
 */
export function useUpdate(): [UpdateFunction, string | null] {
  const [updating, setUpdating] = useState(false);
  const messenger = useMessenger<RouteMessengerInstance>();
  const dispatch = useDispatch();

  const request = useSelector(getFirstSnapInstallOrUpdateRequest);

  const update: UpdateFunction = (snaps) => {
    messenger.call('SnapController:installSnaps', 'MetaMask', snaps);

    forceUpdateMetamaskState(dispatch)
      .then(() => {
        setUpdating(true);
      })
      .catch((error) => {
        console.error(
          'Failed to update MetaMask state after Snap update:',
          error,
        );
      });
  };

  return [update, updating ? request?.metadata.id : null];
}
