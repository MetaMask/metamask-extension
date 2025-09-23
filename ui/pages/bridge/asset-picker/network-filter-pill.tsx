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
  network: {
    id: string;
    name: string;
    image?: string;
  };
}

export const NetworkFilterPill = ({ network }: NetworkFilterPillProps) => {
  return (
    <Box
      key={network.id}
      borderColor={BorderColor.primaryMuted}
      borderWidth={1}
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.backgroundSubsection}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={3}
      paddingRight={3}
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
