// eslint-disable-next-line spaced-comment
/// <reference types="@welldone-software/why-did-you-render" />
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
if (process.env.ENABLE_WHY_DID_YOU_RENDER) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, no-restricted-globals
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}
