import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UNLOCK_ROUTE } from '../helpers/constants/routes';
import { getIsUnlocked } from '../ducks/metamask/metamask';
import { useAppSelector } from '../store/store';

export function useRedirectToUnlockWhenLocked() {
  const isUnlockedState = useAppSelector(getIsUnlocked);
  const navigate = useNavigate();
  const location = useLocation();
  const wasUnlockedRef = useRef(isUnlockedState);

  useEffect(() => {
    const wasUnlocked = wasUnlockedRef.current;

    if (wasUnlocked && !isUnlockedState) {
      const from = `${location.pathname}${location.search}`;
      const searchParams = new URLSearchParams({ from });

      navigate(`${UNLOCK_ROUTE}?${searchParams.toString()}`, {
        replace: true,
      });
    }

    wasUnlockedRef.current = isUnlockedState;
  }, [isUnlockedState, location.pathname, location.search, navigate]);
}
