const path = require('path');

// Resolve the real React entry to avoid alias recursion
const reactPath = require.resolve('react', {
  paths: [path.resolve(__dirname, '..')],
});
const React = require(reactPath);

const useInsertionEffect =
  React.useInsertionEffect || React.useLayoutEffect || React.useEffect;

const useSyncExternalStore =
  React.useSyncExternalStore ||
  ((subscribe, getSnapshot, getServerSnapshot = getSnapshot) => {
    const getCurrentSnapshot =
      typeof getSnapshot === 'function' ? getSnapshot : () => undefined;
    const subscribeToStore =
      typeof subscribe === 'function' ? subscribe : () => () => undefined;

    const [value, setValue] = React.useState(() => getCurrentSnapshot());

    React.useEffect(() => {
      const handleChange = () => {
        setValue(getCurrentSnapshot());
      };
      return subscribeToStore(handleChange);
    }, [subscribeToStore, getCurrentSnapshot]);

    return value === undefined && getServerSnapshot
      ? getServerSnapshot()
      : value;
  });

module.exports = Object.assign({}, React, {
  useInsertionEffect,
  useSyncExternalStore,
  default: React,
});
