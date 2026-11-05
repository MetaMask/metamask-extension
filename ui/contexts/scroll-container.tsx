import React, {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
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

/**
 * Hook to measure the width the scroll container reserves for its scrollbar.
 * This is 0 when the platform uses overlay scrollbars.
 *
 * @returns Scrollbar gutter width in pixels
 */
export const useScrollContainerGutterWidth = () => {
  const scrollContainerRef = useScrollContainer();
  const [gutterWidth, setGutterWidth] = useState(0);

  useLayoutEffect(() => {
    const element = scrollContainerRef?.current;
    if (!element) {
      return undefined;
    }

    const measure = () =>
      setGutterWidth(element.offsetWidth - element.clientWidth);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  return gutterWidth;
};
