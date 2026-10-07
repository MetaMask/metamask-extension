import React from 'react';
import { useSelector } from 'react-redux';
import { Box } from '../../../component-library/box/box';
import { IconSize } from '../../../component-library/icon/icon.types';
import { Text } from '../../../component-library/text/text';
import { SnapIcon } from '../snap-icon/snap-icon';
import { getSnapMetadata } from '../../../../selectors/selectors';
import {
  AlignItems,
  BorderRadius,
  Display,
  FlexDirection,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';

type SnapAuthorshipPillProps = {
  snapId: string;
  onClick: () => void;
};

const SnapAuthorshipPill = ({ snapId, onClick }: SnapAuthorshipPillProps) => {
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  return (
    <Box
      className="snap-authorship-pill"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.pill}
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
