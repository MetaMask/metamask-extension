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
      ellipsis
      data-testid="multichain-token-list-item-token-name"
      className="text-s-body-md @compact:text-s-body-sm"
    >
      {networkTitleOverrides(t as TranslateFunction, { title })}
    </Text>
  );
};
