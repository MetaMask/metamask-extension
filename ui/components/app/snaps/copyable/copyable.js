import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
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
import { SECOND } from '../../../../../shared/constants/time';
import { useTimeout } from '../../../../hooks/useTimeout';

export const Copyable = ({
  text,
  sensitive = false,
  marginTop,
  marginBottom,
}) => {
  const t = useI18nContext();
  const [, handleCopy] = useCopyToClipboard();
  const [isVisible, setIsVisible] = useState(!sensitive);
  const [isClicked, setIsClicked] = useState(false);

  const startTimeout = useTimeout(() => setIsClicked(false), 3 * SECOND, false);

  const handleVisibilityClick = (e) => {
    e.stopPropagation();
    setIsVisible((state) => !state);
  };

  const handleCopyClick = (e) => {
    e.stopPropagation();
    handleCopy(text);
    setIsClicked(true);
    startTimeout();
  };

  return (
    <Box
      display={Display.Flex}
      onClick={
        sensitive && !isVisible ? handleVisibilityClick : handleCopyClick
      }
      className={classnames('copyable', {
        sensitive,
        clicked: isClicked,
        visible: isVisible,
      })}
      backgroundColor={
        isVisible && sensitive
          ? BackgroundColor.errorMuted
          : BackgroundColor.primaryMuted
      }
      borderRadius={BorderRadius.LG}
      padding={2}
      marginTop={marginTop}
      marginBottom={marginBottom}
    >
      {sensitive && (
        <Box marginRight={2} className="copyable__icon">
          <Tooltip
            wrapperClassName="copyable__tooltip"
            html={
              <Text>
                {isVisible ? t('hideSentitiveInfo') : t('doNotShare')}
              </Text>
            }
            position="bottom"
          >
            <Icon
              name={isVisible ? IconName.EyeSlash : IconName.Eye}
              onClick={handleVisibilityClick}
              color={
                isVisible && sensitive
                  ? Color.errorAlternative
                  : IconColor.iconAlternative
              }
              data-testid="reveal-icon"
            />
          </Tooltip>
        </Box>
      )}
      {sensitive && !isVisible && (
        <Text
          color={Color.textAlternative}
          marginRight={2}
          marginBottom={0}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('revealSensitiveContent')}
        </Text>
      )}
      {isVisible && (
        <ShowMore
          marginRight={2}
          buttonBackground={
            isVisible && sensitive
              ? BackgroundColor.errorMuted
              : BackgroundColor.backgroundAlternative
          }
        >
          <Text
            color={
              isVisible && sensitive
                ? Color.errorAlternative
                : TextColor.textAlternative
            }
            marginBottom={0}
            overflowWrap={OverflowWrap.Anywhere}
          >
            {text}
          </Text>
        </ShowMore>
      )}
      {isVisible && (
        <Icon
          className="copyable__icon"
          name={isClicked ? IconName.CopySuccess : IconName.Copy}
          color={
            isVisible && sensitive
              ? Color.errorAlternative
              : IconColor.iconAlternative
          }
          marginLeft="auto"
          data-testid="copy-icon"
        />
      )}
    </Box>
  );
};

Copyable.propTypes = {
  text: PropTypes.string,
  sensitive: PropTypes.bool,
  marginTop: PropTypes.number,
  marginBottom: PropTypes.number,
};
