import React from 'react';

if (process.env.WHY_DID_YOU_RENDER_ENABLED) {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  whyDidYouRender(React, {
    trackAllPureComponents: true,
  });
}
