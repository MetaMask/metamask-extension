import { RefObject, useEffect, useRef } from 'react';

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
  const onClickOutsideRef = useRef(onClickOutside);

  useEffect(() => {
    onClickOutsideRef.current = onClickOutside;
  }, [onClickOutside]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClickOutsideRef.current();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active, containerRef]);
}
