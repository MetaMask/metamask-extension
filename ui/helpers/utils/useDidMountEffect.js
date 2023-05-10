import React, { useEffect, useRef } from 'react';

const useDidMountEffect = (callback, deps) => {
  const didMount = useRef(false);

  useEffect(() => {
    if (didMount.current) {
      return callback();
    } else didMount.current = true;
  }, deps);
};

export default useDidMountEffect;
