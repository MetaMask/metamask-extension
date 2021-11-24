/* eslint-disable node/global-require */
import React from 'react';

if (process.env.NODE_ENV === 'development') {
  const whyDidYouRender = require('@welldone-software/why-did-you-render');
  const ReactRedux = require('react-redux');
  whyDidYouRender(React, {
    // trackAllPureComponents: true,
    trackExtraHooks: [[ReactRedux, 'useSelector']],
  });
}
