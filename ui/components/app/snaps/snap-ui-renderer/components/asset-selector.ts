import type { AssetSelectorElement } from '@metamask/snaps-sdk/jsx';

import type { UIComponentFactory } from './types';

export const assetSelector: UIComponentFactory<AssetSelectorElement> = ({
  element,
  form,
}) => {
  return {
    element: 'SnapUIAssetSelector',
    props: {
      name: element.props.name,
      addresses: element.props.addresses,
      chainIds: element.props.chainIds,
      disabled: element.props.disabled,
      form,
    },
  };
};
