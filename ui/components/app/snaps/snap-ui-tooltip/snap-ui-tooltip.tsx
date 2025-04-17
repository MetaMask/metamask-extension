// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React, { FunctionComponent, ReactNode } from 'react';
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import Tooltip from '../../../ui/tooltip';

export type SnapUITooltipProps = {
  content: ReactNode;
};

export const SnapUITooltip: FunctionComponent<SnapUITooltipProps> = ({
  content,
  children,
}) => {
  return (
    <Tooltip
      html={content}
      position={'bottom'}
      // Avoid tooltip from taking up the full width of the container
      style={{ display: 'inline-flex' }}
    >
      {children}
    </Tooltip>
  );
};
