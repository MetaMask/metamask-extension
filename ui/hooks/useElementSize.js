import { useState, useEffect, useLayoutEffect } from 'react';

export const isBrowser = typeof window !== 'undefined';

const useIsomorphicLayoutEffect = isBrowser ? useLayoutEffect : useEffect;

const pick = function (obj, ...keys) {
  const result = {};

  keys.forEach((key) => {
    result[key] = obj[key];
  });

  return result;
};

export const ElementSize = {
  width: 0,
  height: 0,
};

const toElementSize = (rect) => pick(rect, 'height', 'width');

const areEqualSizes = (one, another) =>
  one.width === another.width && one.height === another.height;

export const useElementSize = (element) => {
  const [size, setSize] = useState(
    element ? toElementSize(element.getBoundingClientRect()) : null,
  );

  useIsomorphicLayoutEffect(() => {
    if (!element) {
      return;
    }

    const handleElementChange = () => {
      const newSize = toElementSize(element.getBoundingClientRect());

      if (size && areEqualSizes(newSize, size)) {
        return;
      }

      setSize(newSize);
    };

    handleElementChange();

    if (!window || !window.ResizeObserver) {
      return;
    }

    const resizeObserver = new ResizeObserver(handleElementChange);

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [element]);

  return size;
};
