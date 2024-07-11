import React from 'react';

import {
  BUILT_IN_NETWORKS,
  NETWORK_TYPES,
} from '../../../../shared/constants/network';
import { Severity, Size } from '../../../helpers/constants/design-system';

import { BannerAlert } from '../../component-library/banner-alert';
import NetworkDisplay from '.';

export default {
  title: 'Components/App/NetworkDisplay',

  argTypes: {
    indicatorSize: {
      control: 'select',
      options: Object.values(Size),
    },
    labelProps: {
      control: 'object',
    },
    targetNetwork: {
      control: 'select',
      options: [...Object.keys(BUILT_IN_NETWORKS), NETWORK_TYPES.RPC],
    },
    disabled: {
      control: 'boolean',
    },
    onClick: {
      action: 'onClick',
      description:
        'The onClick event handler of the NetworkDisplay. If it is not passed it is assumed that the NetworkDisplay SHOULD NOT be interactive and removes the caret and changes the border color of the NetworkDisplay to border-muted',
    },
  },
  args: {
    targetNetwork: 'goerli',
  },
};

export const DefaultStory = (args) => (
  <>
    <BannerAlert
      severity={Severity.Warning}
      title="Deprecated"
      description="The <NetworkDisplay> component has been deprecated in favor of the new <PickerNetwork> component from the component-library.
        Please update your code to use the new <PickerNetwork> component instead, which can be found at ui/components/component-library/picker-network/picker-network.tsx."
      actionButtonLabel="See details"
      actionButtonProps={{
        href: 'https://github.com/MetaMask/metamask-extension/issues/20485',
      }}
      marginBottom={4}
    />
    <NetworkDisplay
      {...args}
      targetNetwork={{
        type: args.targetNetwork,
        nickname: args.targetNetwork,
      }}
    />
  </>
);

DefaultStory.storyName = 'Default';

export const TargetNetwork = (args) => {
  const targetNetworkArr = [
    ...Object.keys(BUILT_IN_NETWORKS),
    NETWORK_TYPES.RPC,
  ];
  return (
    <>
      {Object.values(targetNetworkArr).map((variant) => (
        <NetworkDisplay
          {...args}
          key={variant}
          targetNetwork={{
            type: variant,
            nickname: variant,
          }}
        />
      ))}
    </>
  );
};

export const DisplayOnly = (args) => {
  const targetNetworkArr = [
    ...Object.keys(BUILT_IN_NETWORKS),
    NETWORK_TYPES.RPC,
  ];
  return (
    <>
      {Object.values(targetNetworkArr).map((variant) => (
        <NetworkDisplay
          {...args}
          key={variant}
          targetNetwork={{
            type: variant,
            nickname: variant,
          }}
          onClick={undefined}
        />
      ))}
    </>
  );
};
