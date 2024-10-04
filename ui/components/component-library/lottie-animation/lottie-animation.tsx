import React, { useEffect, useRef } from 'react';
import lottie, { AnimationConfigWithPath, AnimationItem } from 'lottie-web';

export type LottieAnimationProps = {
  /** The URL or path to the Lottie JSON animation file. */
  path: string;
  /** Whether the animation should loop. Defaults to true. */
  loop?: boolean;
  /** Whether the animation should start playing automatically. Defaults to true. */
  autoplay?: boolean;
  /** Optional inline styles for the container div. */
  style?: React.CSSProperties;
  /** Optional CSS class for the container div. */
  className?: string;
  /** Optional callback function that is called when the animation completes. */
  onComplete?: () => void;
};

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  path,
  loop = true,
  autoplay = true,
  style = {},
  className = '',
  onComplete = () => {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationInstance = useRef<AnimationItem | null>(null);

  useEffect(() => {
    const animationConfig: AnimationConfigWithPath = {
      container: containerRef.current as HTMLElement,
      renderer: 'svg',
      loop,
      autoplay,
      path,
    };

    animationInstance.current = lottie.loadAnimation(animationConfig);

    animationInstance.current.addEventListener('complete', onComplete);

    return () => {
      if (animationInstance.current) {
        animationInstance.current.removeEventListener('complete', onComplete);
        animationInstance.current.destroy();
        animationInstance.current = null;
      }
    };
  }, [path, loop, autoplay, onComplete]);

  return <div ref={containerRef} style={style} className={className}></div>;
};
