import React from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import { Box, Text } from '../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  FontWeight,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { RecipientWithAddress } from '../../../../components/ui/sender-to-recipient/sender-to-recipient.component';
import { REMOTE_ROUTE } from '../../../../helpers/constants/routes';
import { setSelectedAccount } from '../../../../store/actions';

export const RemoteSignerInformation = ({
  signerAddress,
  originalSenderAddress,
}: {
  signerAddress: string;
  originalSenderAddress: string;
}) => {
  const history = useHistory();
  const dispatch = useDispatch();
  const checksummedSignerAddress = toChecksumHexAddress(signerAddress);

  const onPermissionClick = () => {
    dispatch(setSelectedAccount(originalSenderAddress));
    history.push(REMOTE_ROUTE);
  };

  return (
    <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
      {/* TODO: Use i18n */}
      <Text
        variant={TextVariant.bodySm}
        fontWeight={FontWeight.Bold}
        color={TextColor.textDefault}
      >
        Remote Signer
      </Text>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        gap={2}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
      >
        <RecipientWithAddress
          checksummedRecipientAddress={checksummedSignerAddress}
          addressOnly
        />
        <Text
          display={Display.InlineBlock}
          color={TextColor.infoDefault}
          variant={TextVariant.bodyMd}
          onClick={onPermissionClick}
          style={{ cursor: 'pointer', paddingLeft: 2 }}
        >
          View permissions
        </Text>
      </Box>
    </Box>
  );
};

export default RemoteSignerInformation;
