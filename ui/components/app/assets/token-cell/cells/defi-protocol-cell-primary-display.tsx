import React from 'react';
import {
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  SensitiveText,
  SensitiveTextLength,
} from '../../../../component-library';
import { TokenFiatDisplayInfo } from '../../types';
import { AssetCellLocation } from '../asset-cell';
import asset from '../../../../../pages/asset';
import { AvatarGroup } from '../../../../multichain';
import { AvatarType } from '../../../../multichain/avatar-group/avatar-group.types';

type DeFiCellPrimaryDisplayProps = {
  iconGroup: { avatarValue: string; symbol: string }[];
};

export const DeFiProtocolCellPrimaryDisplay = ({
  iconGroup,
}: DeFiCellPrimaryDisplayProps) => {
  return (
    <AvatarGroup avatarType={AvatarType.TOKEN} limit={4} members={iconGroup} />
  );
};
