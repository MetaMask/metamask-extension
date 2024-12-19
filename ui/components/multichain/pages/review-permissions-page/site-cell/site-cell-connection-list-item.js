import React from 'react';
import PropTypes from 'prop-types';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  FlexDirection,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import {
  AvatarIcon,
  AvatarIconSize,
  Box,
  ButtonLink,
  Text,
} from '../../../../component-library';
import { useI18nContext } from '../../../../../hooks/useI18nContext';

export const SiteCellConnectionListItem = ({
  title,
  iconName,
  connectedMessage,
  unconnectedMessage,
  isConnectFlow,
  onClick,
  content,
  paddingTopValue,
  paddingBottomValue,
}) => {
  const t = useI18nContext();

  return (
    <Box
      data-testid="site-cell-connection-list-item"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      alignItems={AlignItems.baseline}
      width={BlockSize.Full}
      backgroundColor={BackgroundColor.backgroundDefault}
      gap={4}
      className="multichain-connection-list-item"
      paddingTop={paddingTopValue}
      paddingBottom={paddingBottomValue}
    >
      <AvatarIcon
        iconName={iconName}
        size={AvatarIconSize.Md}
        color={IconColor.iconAlternative}
        backgroundColor={BackgroundColor.backgroundAlternative}
      />
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        width={BlockSize.FiveTwelfths}
        style={{ alignSelf: 'center', flexGrow: 1 }}
        gap={1}
      >
        <Text variant={TextVariant.bodyMd} textAlign={TextAlign.Left}>
          {title}
        </Text>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          gap={1}
        >
          <Text
            as="span"
            width={BlockSize.Max}
            color={TextColor.textAlternative}
            variant={TextVariant.bodySm}
            ellipsis
          >
            {isConnectFlow ? unconnectedMessage : connectedMessage}
          </Text>
          {content}
        </Box>
      </Box>
      <ButtonLink onClick={() => onClick()} data-testid="edit">
        {t('edit')}
      </ButtonLink>
    </Box>
  );
};
SiteCellConnectionListItem.propTypes = {
  /**
   * Title that should be displayed in the connection list item
   */
  title: PropTypes.string,

  /**
   * The name of the icon that should be passed to the AvatarIcon component
   */
  iconName: PropTypes.string,

  /**
   * The message that should be displayed when there are connected accounts
   */
  connectedMessage: PropTypes.string,

  /**
   * Padding Top Value to keep the padding between list items same
   */
  paddingTopValue: PropTypes.number,

  /**
   * Padding Bottom Value to keep the padding between list items same
   */
  paddingBottomValue: PropTypes.number,

  /**
   * The message that should be displayed when there are no connected accounts
   */
  unconnectedMessage: PropTypes.string,

  /**
   * If the component should show context related to adding a connection or editing one
   */
  isConnectFlow: PropTypes.bool,

  /**
   * Handler called when the edit button is clicked
   */
  onClick: PropTypes.func,

  /**
   * Components to display in the connection list item
   */
  content: PropTypes.node,
};
