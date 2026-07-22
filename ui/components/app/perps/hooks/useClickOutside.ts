import { RefObject, useEffect } from 'react';

type UseOnClickOutsideOptions = {
  containerRef: RefObject<HTMLDivElement>;
  onClickOutside: () => void;
  active?: boolean;
};

export function useOnClickOutside({
  containerRef,
  onClickOutside,
  active,
}: UseOnClickOutsideOptions) {
  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClickOutside();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active, containerRef, onClickOutside]);
}
