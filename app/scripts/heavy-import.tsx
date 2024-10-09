import * as actions from '../../ui/store/actions';
import { TEST } from '../../ui/pages/routes/routes.component';

import React from 'react';

export const HeavyImport = () => {
  actions.showLoadingIndication();
  console.log(TEST);
  return <div>Heavy Import</div>;
};

export default HeavyImport;
