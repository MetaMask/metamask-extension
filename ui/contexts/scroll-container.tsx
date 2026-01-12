import React, { createContext, useContext, useCallback, useState } from 'react';

const ScrollContainerContext = createContext<HTMLDivElement | null>(null);

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
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null,
  );

  const scrollRef = useCallback((element: HTMLDivElement | null) => {
    setScrollElement(element);
  }, []);

  return (
    <ScrollContainerContext.Provider value={scrollElement}>
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
