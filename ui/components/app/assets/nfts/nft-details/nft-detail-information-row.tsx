import React, { useState } from 'react';

import {
  Box,
  Popover,
  PopoverPosition,
  Text,
} from '../../../../component-library';
import {
  BackgroundColor,
  Display,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';

type NftDetailInformationRowProps = {
  title: string;
  valueColor?: TextColor;
  value?: string | null;
  icon?: React.ReactNode;
  buttonAddressValue?: React.ButtonHTMLAttributes<HTMLButtonElement> | null;
  withPopover?: boolean;
  fullValue?: string;
};

const NftDetailInformationRow: React.FC<NftDetailInformationRowProps> = ({
  title,
  valueColor,
  value,
  icon,
  buttonAddressValue,
  withPopover,
  fullValue,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMouseEnter = () => {
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const [referenceElement, setReferenceElement] = useState();

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setBoxRef = (ref: any) => {
    setReferenceElement(ref);
  };

  if (!value && !buttonAddressValue) {
    return null;
  }
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.spaceBetween}
      marginTop={2}
    >
      <Text
        color={TextColor.textAlternative}
        variant={TextVariant.bodyMdMedium}
      >
        {title}
      </Text>
      {icon ? (
        <Box display={Display.Flex}>
          {buttonAddressValue ? (
            { ...buttonAddressValue }
          ) : (
            <Text
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              color={valueColor || TextColor.textDefault}
              variant={TextVariant.bodyMdMedium}
            >
              {value}
            </Text>
          )}
          {icon}
        </Box>
      ) : (
        <Text
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          color={valueColor || TextColor.textDefault}
          variant={TextVariant.bodyMdMedium}
        >
          {withPopover && fullValue ? (
            <>
              <Box
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                ref={setBoxRef}
              >
                {value}
              </Box>
              <Popover
                referenceElement={referenceElement}
                isOpen={isOpen}
                position={PopoverPosition.BottomStart}
                hasArrow
                flip
                backgroundColor={BackgroundColor.overlayAlternative}
                className="tokenId-popover"
                paddingLeft={4}
                paddingRight={4}
              >
                <Text
                  variant={TextVariant.bodySm}
                  color={TextColor.overlayInverse}
                >
                  {fullValue}
                </Text>
              </Popover>
            </>
          ) : (
            value
          )}
        </Text>
      )}
    </Box>
  );
};

export default NftDetailInformationRow;
