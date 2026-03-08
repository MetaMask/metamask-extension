import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';

export type AnimatedRef = {
  triggerExit: (onComplete: () => void) => void;
};

export const Animated = forwardRef<AnimatedRef, { children: React.ReactNode }>(
  ({ children }, fwdRef) => {
    const innerRef = useRef<HTMLDivElement>(null);

    const triggerExit = useCallback((onComplete: () => void) => {
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
      <div ref={innerRef} className="page-enter-animation h-full">
        {children}
      </div>
    );
  },
);

Animated.displayName = 'Animated';
