import React from 'react';
import { FontWeight } from '../../../../../helpers/constants/design-system';
import { Text } from '../../../../component-library';
import {
  TranslateFunction,
  networkTitleOverrides,
} from '../../util/networkTitleOverrides';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

type AssetCellTitleProps = {
  title: string;
};

export const AssetCellTitle = ({ title }: AssetCellTitleProps) => {
  const t = useI18nContext();

  // non-ellipsized title
  return (
    <Text
      fontWeight={FontWeight.Medium}
      className="text-s-body-md @compact:text-s-body-sm"
      ellipsis
      data-testid="multichain-token-list-item-token-name"
      // TEMPORARY (1/1): Element Timing probe for the async-decoding A/B pilot.
      // Remove with .github/workflows/pilot-async.yml.
      {...{ elementtiming: 'token-name' }}
    >
      {networkTitleOverrides(t as TranslateFunction, { title })}
    </Text>
  );
};
