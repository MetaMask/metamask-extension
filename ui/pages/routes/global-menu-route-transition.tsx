import classnames from 'clsx';
import React, {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';

type TransitionDirection = 'forward' | 'back';

type RunCloseTransition = (onComplete: () => void) => void;

const GlobalMenuRouteTransitionContext = createContext<RunCloseTransition>(
  (onComplete) => onComplete(),
);

export const useGlobalMenuRouteTransition = () =>
  useContext(GlobalMenuRouteTransitionContext);

export const GlobalMenuRouteTransition = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const location = useLocation();
  const shouldAnimate = location.state?.globalMenuTransition === 'forward';
  const [transitionDirection, setTransitionDirection] =
    useState<TransitionDirection | null>(() =>
      shouldAnimate ? 'forward' : null,
    );
  const onCloseCompleteRef = useRef<(() => void) | null>(null);

  useLayoutEffect(() => {
    setTransitionDirection(shouldAnimate ? 'forward' : null);
  }, [location.key, shouldAnimate]);

  const runCloseTransition = useCallback<RunCloseTransition>((onComplete) => {
    onCloseCompleteRef.current = onComplete;
    setTransitionDirection('back');
  }, []);

  const contextValue = useMemo(() => runCloseTransition, [runCloseTransition]);

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.currentTarget !== event.target) {
      return;
    }

    if (transitionDirection !== 'back') {
      setTransitionDirection(null);
      return;
    }

    const onCloseComplete = onCloseCompleteRef.current;
    onCloseCompleteRef.current = null;
    onCloseComplete?.();
  };

  return (
    <GlobalMenuRouteTransitionContext.Provider value={contextValue}>
      <div
        className={classnames('global-menu-route-transition-wrapper', {
          'global-menu-route-transition-wrapper--animating':
            transitionDirection !== null,
        })}
      >
        <div
          className={classnames(
            'global-menu-route-transition-wrapper__content',
            {
              'global-menu-route-transition-wrapper__content--forward':
                transitionDirection === 'forward',
              'global-menu-route-transition-wrapper__content--back':
                transitionDirection === 'back',
            },
          )}
          onAnimationEnd={handleAnimationEnd}
        >
          {children}
        </div>
      </div>
    </GlobalMenuRouteTransitionContext.Provider>
  );
};
