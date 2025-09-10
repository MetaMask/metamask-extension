import React from 'react';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../../components/component-library';
import {
  BlockSize,
  Display,
  FlexDirection,
  AlignItems,
  JustifyContent,
  BackgroundColor,
} from '../../../../helpers/constants/design-system';
import type { DestinationAccount } from '../types';
import DestinationAccountListItem from './destination-account-list-item';

type DestinationAccountPickerProps = {
  onOpenRecipientModal: () => void;
  selectedSwapToAccount: DestinationAccount | null;
};

export const DestinationAccountPicker = ({
  onOpenRecipientModal,
  selectedSwapToAccount,
}: DestinationAccountPickerProps) => {
  if (selectedSwapToAccount) {
    return (
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        width={BlockSize.Full}
        className="swap-to-account-picker"
        backgroundColor={BackgroundColor.backgroundDefault}
        style={{
          height: '70px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-size-sm) var(--color-shadow-default)',
        }}
      >
        <Box
          className="destination-account-picker__selected"
          width={BlockSize.Full}
          style={{ flex: 1, minWidth: 0 }}
        >
          <DestinationAccountListItem account={selectedSwapToAccount} />
        </Box>
        <Box className="deselect-button-container" paddingRight={5}>
          <Button
            onClick={() => onOpenRecipientModal()}
            aria-label="Deselect account"
            variant={ButtonVariant.Link}
            size={ButtonSize.Sm}
            className="deselect-button"
            style={{
              padding: '5px',
              color: 'var(--color-icon-alternative)',
              textDecoration: 'none',
            }}
          >
            ✕
          </Button>
        </Box>
      </Box>
    );
  }
  return null;
};
