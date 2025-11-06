import React, { createContext, useContext, useRef } from 'react';

const ScrollContainerContext =
  createContext<React.RefObject<HTMLDivElement> | null>(null);

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

export const useScrollContainer = () => {
  return useContext(ScrollContainerContext);
};
