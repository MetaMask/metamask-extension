import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useRef,
} from 'react';

type TriggerExit = (onComplete: () => void) => void;

export type AnimatedRef = {
  triggerExit: TriggerExit;
};

const AnimatedContext = createContext<TriggerExit | null>(null);

export const useAnimatedExit = (): TriggerExit => {
  const ctx = useContext(AnimatedContext);
  return ctx ?? ((cb) => cb());
};

export const Animated = forwardRef<AnimatedRef, { children: React.ReactNode }>(
  ({ children }, fwdRef) => {
    const innerRef = useRef<HTMLDivElement>(null);

    const triggerExit: TriggerExit = useCallback((onComplete) => {
      const el = innerRef.current;
      if (!el) {
        onComplete();
        return;
      }
      el.classList.replace('page-enter-animation', 'page-exit-animation');
      const style = globalThis.getComputedStyle?.(el);
      const hasAnimation =
        style?.animationName && style.animationName !== 'none';
      if (hasAnimation) {
        let done = false;
        const finish = () => {
          if (done) {
            return;
          }
          done = true;
          onComplete();
        };
        el.addEventListener('animationend', finish, { once: true });
        setTimeout(finish, 250);
      } else {
        onComplete();
      }
    }, []);

    useImperativeHandle(fwdRef, () => ({ triggerExit }), [triggerExit]);

    return (
      <AnimatedContext.Provider value={triggerExit}>
        <div ref={innerRef} className="page-enter-animation h-full">
          {children}
        </div>
      </AnimatedContext.Provider>
    );
  },
);

Animated.displayName = 'Animated';
