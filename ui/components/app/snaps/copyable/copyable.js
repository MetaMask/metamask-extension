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

export const Copyable = ({ text, sensitive = false }) => {
  const t = useI18nContext();
  const [, handleCopy] = useCopyToClipboard();
  const [isVisible, setIsisVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const startTimeout = useTimeout(() => setIsClicked(false), 3 * SECOND, false);

  const handleVisibilityClick = (e) => {
    e.stopPropagation();
    setIsisVisible(!isVisible);
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
      })}
      backgroundColor={
        isVisible
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
                isVisible ? Color.errorAlternative : IconColor.iconAlternative
              }
              data-testid="reveal-icon"
            />
          </Tooltip>
        </Box>
      )}
      {sensitive && !isVisible && (
        <Text
          color={Color.textAlternative}
          marginRight={4}
          marginBottom={0}
          overflowWrap={OverflowWrap.Anywhere}
        >
          {t('revealSensitiveContent')}
        </Text>
      )}
      {(!sensitive || (sensitive && isVisible)) && (
        <ShowMore
          marginRight={4}
          buttonBackground={
            isVisible
              ? BackgroundColor.errorMuted
              : BackgroundColor.backgroundAlternative
          }
        >
          <Text
            color={
              isVisible ? Color.errorAlternative : TextColor.textAlternative
            }
            marginBottom={0}
            overflowWrap={OverflowWrap.Anywhere}
          >
            {text}
          </Text>
        </ShowMore>
      )}
      {(!sensitive || (sensitive && isVisible)) && (
        <Icon
          className="copyable__icon"
          name={isClicked ? IconName.CopySuccess : IconName.Copy}
          color={isVisible ? Color.errorAlternative : IconColor.iconAlternative}
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
};
