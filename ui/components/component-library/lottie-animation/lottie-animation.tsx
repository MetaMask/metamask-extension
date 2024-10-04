import React, { useEffect, useRef } from 'react';
import { AnimationConfigWithData, AnimationItem } from 'lottie-web';
// Use lottie_light to avoid unsafe-eval which breaks the CSP
// https://github.com/airbnb/lottie-web/issues/289#issuecomment-1454909624
import lottie from 'lottie-web/build/player/lottie_light';

export type LottieAnimationProps = {
  data: object;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  className?: string;
  onComplete?: () => void;
};

export const LottieAnimation: React.FC<LottieAnimationProps> = ({
  data,
  loop = true,
  autoplay = true,
  style = {},
  className = '',
  onComplete = () => null,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationInstance = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      console.error('LottieAnimation: containerRef is null');
      return () => null;
    }

    const animationConfig: AnimationConfigWithData = {
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay,
      animationData: data,
    };

    try {
      animationInstance.current = lottie.loadAnimation(animationConfig);
      animationInstance.current.addEventListener('complete', onComplete);

      animationInstance.current.addEventListener('error', (error) => {
        console.error('LottieAnimation error:', error);
      });
    } catch (error) {
      console.error('Failed to load animation:', error);
    }

    return () => {
      if (animationInstance.current) {
        animationInstance.current.removeEventListener('complete', onComplete);
        animationInstance.current.destroy();
        animationInstance.current = null;
      }
    };
  }, [data, loop, autoplay, onComplete]);

  return <div ref={containerRef} style={style} className={className}></div>;
};
