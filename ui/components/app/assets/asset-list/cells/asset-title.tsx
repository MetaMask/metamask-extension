import React from 'react';
import {
  FontWeight,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
      variant={TextVariant.bodyMd}
      ellipsis
      data-testid="multichain-token-list-item-token-name"
    >
      {networkTitleOverrides(t as TranslateFunction, { title })}
    </Text>
  );
};
