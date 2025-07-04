import React, { memo, useCallback, useState } from 'react';
import {
  BackgroundColor,
  Display,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import ZENDESK_URLS from '../../../../../helpers/constants/zendesk-url';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  ButtonLink,
  ButtonLinkSize,
  IconName,
  IconSize,
  Popover,
  PopoverPosition,
} from '../../../../component-library';
import { Box } from '../../../../component-library/box';
import { Icon } from '../../../../component-library/icon';
import { Text } from '../../../../component-library/text';

/**
 * AdditionalNetworksInfo Component
 *
 * Displays information about additional networks in the network manager with
 * an info tooltip that appears on hover to provide more context to the user.
 */
export const AdditionalNetworksInfo = memo(() => {
  const t = useI18nContext();
  const [isOpen, setIsOpen] = useState(false);
  // State and ref for positioning the popover relative to its trigger
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null);

  // Handler for mouse enter - shows the popover
  const handleMouseEnter = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Handler for mouse leave - hides the popover
  const handleMouseLeave = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setBoxRef = useCallback((ref: HTMLDivElement | null) => {
    setReferenceElement(ref);
  }, []);

  // Handler for "Learn More" button click - opens external documentation
  const handleLearnMoreClick = useCallback(() => {
    global.platform.openTab({
      url: ZENDESK_URLS.UNKNOWN_NETWORK,
    });
  }, []);

  return (
    <Box
      paddingTop={2}
      paddingRight={4}
      paddingLeft={4}
      onMouseLeave={handleMouseLeave}
    >
      <Box display={Display.Flex} justifyContent={JustifyContent.spaceBetween}>
        {/* Container for the "Additional Networks" text and info icon */}
        <Box display={Display.InlineFlex} ref={setBoxRef}>
          {/* Label text - uses translation key "additionalNetworks" */}
          <Text
            color={TextColor.textAlternative}
            variant={TextVariant.bodyMdMedium}
          >
            {t('additionalNetworks')}
          </Text>

          {/* Info icon with hover trigger for popover */}
          <Box onMouseEnter={handleMouseEnter} marginTop={1}>
            <Icon
              className="add-network__warning-icon"
              name={IconName.Info}
              color={IconColor.iconMuted}
              size={IconSize.Sm}
              marginLeft={2}
            />
            {/* Popover component that shows when user hovers over the info icon */}
            <Popover
              referenceElement={referenceElement}
              position={PopoverPosition.TopStart}
              paddingTop={3}
              paddingBottom={3}
              offset={[16, 12]}
              isOpen={isOpen}
              flip
              backgroundColor={BackgroundColor.backgroundSection}
              onMouseLeave={handleMouseLeave}
              style={{
                zIndex: 1000,
                width: '326px', // Fixed width for the popover
              }}
            >
              {/* Popover content - explanatory text */}
              <Text variant={TextVariant.bodyMd}>
                {t('popularNetworkAddToolTip')}
              </Text>
              {/* Learn more link that opens external documentation */}
              <Box key="learn-more-link">
                <ButtonLink
                  size={ButtonLinkSize.Auto}
                  externalLink
                  onClick={handleLearnMoreClick}
                >
                  {t('learnMoreUpperCase')}
                </ButtonLink>
              </Box>
            </Popover>
          </Box>
        </Box>
      </Box>
    </Box>
  );
});
