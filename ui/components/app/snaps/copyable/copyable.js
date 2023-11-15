import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  BorderRadius,
  BackgroundColor,
  TextColor,
  Color,
  Display,
  OverflowWrap,
  IconColor,
} from '../../../../helpers/constants/design-system';
import { useCopyToClipboard } from '../../../../hooks/useCopyToClipboard';
import { Icon, IconName, Box, Text } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Tooltip from '../../../ui/tooltip';
import { ShowMore } from '../show-more';

export const Copyable = ({ text, sensitive = false }) => {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();
  const [visible, setIsVisible] = useState(false);

  const handleVisibilityClick = () => setIsVisible(!visible);
  const handleCopyClick = () => {
    if (!copied) {
      handleCopy(text);
    }
  };
  return (
    <Box
      display={Display.Flex}
      className="copyable"
      backgroundColor={
        visible
          ? BackgroundColor.errorMuted
          : BackgroundColor.backgroundAlternative
      }
      borderRadius={BorderRadius.LG}
      padding={4}
    >
      {sensitive && (
        <Box marginRight={4} className="copyable__icon">
          <Tooltip
            wrapperClassName="copyable__tooltip"
            html={
              <Text>{visible ? t('hideSentitiveInfo') : t('doNotShare')}</Text>
            }
            position="bottom"
          >
            <Icon
              name={visible ? IconName.EyeSlash : IconName.Eye}
              onClick={handleVisibilityClick}
              color={
                visible ? Color.errorAlternative : IconColor.iconAlternative
              }
            />
          </Tooltip>
        </Box>
      )}
      {sensitive && !visible && (
        <Text
          color={Color.textAlternative}
          marginRight={4}
          marginBottom={0}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('revealSensitiveContent')}
        </Text>
      )}
      {(!sensitive || (sensitive && visible)) && (
        <ShowMore
          marginRight={4}
          buttonBackground={
            visible
              ? BackgroundColor.errorMuted
              : BackgroundColor.backgroundAlternative
          }
        >
          <Text
            color={visible ? Color.errorAlternative : TextColor.textAlternative}
            marginBottom={0}
            overflowWrap={OverflowWrap.Anywhere}
          >
            {text}
          </Text>
        </ShowMore>
      )}
      {(!sensitive || (sensitive && visible)) && (
        <Icon
          className="copyable__icon"
          name={copied ? IconName.CopySuccess : IconName.Copy}
          color={visible ? Color.errorAlternative : IconColor.iconAlternative}
          onClick={handleCopyClick}
          marginLeft="auto"
        />
      )}
    </Box>
  );
};

Copyable.propTypes = {
  text: PropTypes.string,
  sensitive: PropTypes.bool,
};
