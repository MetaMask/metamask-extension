import React from 'react';
import { useSelector } from 'react-redux';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
} from '@metamask/design-system-react';
import { IconSize, Text } from '../../../component-library';
import { SnapIcon } from '../snap-icon';
import { getSnapMetadata } from '../../../../selectors';
import {
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

type SnapAuthorshipPillProps = {
  snapId: string;
  onClick: () => void;
};

const SnapAuthorshipPill: React.FC<SnapAuthorshipPillProps> = ({
  snapId,
  onClick,
}) => {
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  return (
    <Box
      className="flex snap-authorship-pill rounded-full"
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={1}
      paddingRight={2}
      onClick={onClick}
    >
      <SnapIcon avatarSize={IconSize.Sm} snapId={snapId} />
      <Text
        color={TextColor.primaryDefault}
        variant={TextVariant.bodyMdMedium}
        ellipsis
        paddingLeft={1}
      >
        {snapName}
      </Text>
    </Box>
  );
};

export default SnapAuthorshipPill;
