import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import { BackgroundColor, BorderColor, BorderRadius, FontWeight, JustifyContent, TextVariant } from "../../../helpers/constants/design-system"
import { Column, Row } from "../layout"
import { Box, AvatarNetwork, AvatarNetworkSize, Text } from "../../../components/component-library"

interface NetworkFilterPillProps {
  selected: boolean;
  network: {
    id: string;
    name: string;
    image?: string;
  };
  onSelect: (id: string) => void;
}

export const NetworkFilterPill = ({ selected, network, onSelect }: NetworkFilterPillProps) => {
  return (
    <Box
      key={network.id}
      borderColor={BorderColor.primaryMuted}
      borderWidth={1}
      borderRadius={BorderRadius.LG}
      backgroundColor={selected ? BackgroundColor.primaryMuted : BackgroundColor.backgroundSubsection}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={3}
      paddingRight={3}
      onClick={() => onSelect(network.id)}
      style={{
        flex: '1 1 0',
        minWidth: 'fit-content',
        cursor: 'pointer',
      }}
    >
      <Column gap={1}>
        <Row gap={1} justifyContent={JustifyContent.center}>
          <AvatarNetwork
            key={network.id}
            name={network.name}
            src={network.image}
            size={AvatarNetworkSize.Xs}
          />
          <Text fontWeight={FontWeight.Medium} variant={TextVariant.bodySm}>{network.name}</Text>
        </Row>
      </Column>
    </Box>
  )
}
