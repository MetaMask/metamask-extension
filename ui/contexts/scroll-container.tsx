import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useLayoutEffect,
  RefObject,
} from 'react';

const ScrollContainerContext =
  createContext<React.RefObject<HTMLDivElement> | null>(null);

/**
 * Provides a ref to this container element for its child components
 *
 * @param props - HTML div attributes
 * @param props.children - Child components to render inside the container
 * @returns A div element with a ref accessible via useScrollContainer
 */
export const ScrollContainer = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <ScrollContainerContext.Provider value={scrollRef}>
      <div ref={scrollRef} {...props}>
        {children}
      </div>
    </ScrollContainerContext.Provider>
  );
};

/**
 * Hook to access the scroll container ref from any child component
 *
 * @returns Ref to the scroll container
 */
export const useScrollContainer = () => {
  return useContext(ScrollContainerContext);
};

export const useScrollContainerOffset = (
  elementRef: RefObject<HTMLElement | null>,
): number => {
  const scrollContainerRef = useScrollContainer();
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    let rafId: number;

    const measure = () => {
      const element = elementRef.current;
      const scrollContainer = scrollContainerRef?.current;
      if (element && scrollContainer) {
        setOffset(
          element.getBoundingClientRect().top -
            scrollContainer.getBoundingClientRect().top +
            scrollContainer.scrollTop,
        );
      } else {
        // Refs not ready yet, try again next frame
        rafId = requestAnimationFrame(measure);
      }
    };

    measure();

    return () => cancelAnimationFrame(rafId);
  }, [elementRef, scrollContainerRef]);

  return offset;
};
