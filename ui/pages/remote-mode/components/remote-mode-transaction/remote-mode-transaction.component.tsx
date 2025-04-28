import React from 'react';

import { Icon, IconName } from '../../../../components/component-library';

const RemoteModeTransaction = () => {
  const controllerIcon = `url('./images/controller.svg')`;

  return (
    <Icon
      name={IconName.Global}
      style={{
        maskImage: controllerIcon,
        WebkitMaskImage: controllerIcon,
        display: 'inline-block',
      }}
    />
  );
};

export default RemoteModeTransaction;
