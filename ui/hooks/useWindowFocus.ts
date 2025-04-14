import { useEffect, useState } from 'react';

export const useWindowFocus = () => {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  const [isFocused, setIsFocused] = useState(document.hasFocus());

  useEffect(() => {
    const onFocus = () => setIsFocused(true);
    const onBlur = () => setIsFocused(false);

    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    window.addEventListener('focus', onFocus);
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
    // eslint-disable-next-line no-restricted-globals
    window.addEventListener('blur', onBlur);

    return () => {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      window.removeEventListener('focus', onFocus);
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
      // eslint-disable-next-line no-restricted-globals
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  return isFocused;
};
