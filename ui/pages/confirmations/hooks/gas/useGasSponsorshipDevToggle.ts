import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { getPreferences } from '../../../../selectors';
import { setPreference } from '../../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../../store/store';

const GAS_SPONSORSHIP_DEV_TOGGLE_PREFERENCE_KEY =
  'confirmationsGasSponsorshipDevEnabled';

type GasSponsorshipDevTogglePreferences = {
  confirmationsGasSponsorshipDevEnabled?: boolean;
};

export function useGasSponsorshipDevToggle() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const enabled = useSelector((state) => {
    const preferences = getPreferences(
      state,
    ) as GasSponsorshipDevTogglePreferences;

    return Boolean(preferences.confirmationsGasSponsorshipDevEnabled);
  });

  const setEnabled = useCallback(
    (value: boolean) => {
      dispatch(
        setPreference(GAS_SPONSORSHIP_DEV_TOGGLE_PREFERENCE_KEY, value, false),
      );
    },
    [dispatch],
  );

  const toggle = useCallback(() => {
    setEnabled(!enabled);
  }, [enabled, setEnabled]);

  return {
    enabled,
    setEnabled,
    toggle,
  };
}
