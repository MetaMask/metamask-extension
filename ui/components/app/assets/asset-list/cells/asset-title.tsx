import React from 'react';
import {
  Display,
  FontWeight,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { Text } from '../../../../component-library';
import {
  TranslateFunction,
  networkTitleOverrides,
} from '../../util/networkTitleOverrides';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import Tooltip from '../../../../ui/tooltip';

type AssetCellTitleProps = {
  title: string;
};

export const AssetCellTitle = ({ title }: AssetCellTitleProps) => {
  const t = useI18nContext();

  if (title && title.length > 12) {
    return (
      <Tooltip
        position="bottom"
        html={title}
        wrapperClassName="token-cell-title--ellipsis"
      >
        <Text
          as="span"
          data-testid="multichain-token-list-item-token-name"
          fontWeight={FontWeight.Medium}
          variant={TextVariant.bodyMd}
          display={Display.Block}
          ellipsis
        >
          {networkTitleOverrides(t as TranslateFunction, { title })}
        </Text>
      </Tooltip>
    );
  }

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
