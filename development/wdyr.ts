// eslint-disable-next-line spaced-comment
/// <reference types="@welldone-software/why-did-you-render" />
import React from 'react';

if (process.env.ENABLE_WHY_DID_YOU_RENDER) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}
