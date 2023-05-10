import React from 'react';
import {
  AlignItems,
  BLOCK_SIZES,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  TextAlign,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  BUTTON_SIZES,
  Button,
  ButtonIcon,
  ButtonIconSize,
  IconName,
  Text,
} from '../../../../component-library';
import Box from '../../../../ui/box';
import { IQuizInformationProps } from '../types';

const QuizContent = ({
  header,
  image,
  title,
  content,
  icon,
  buttons,
  dismiss,
}: IQuizInformationProps) => {
  const t = useI18nContext();

  return (
    <Box>
      <>
        <Box>
          <Box
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.ROW}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.flexEnd}
            marginBottom={6}
          >
            <Text
              variant={TextVariant.headingSm}
              textAlign={TextAlign.Center}
              width={BLOCK_SIZES.FULL}
            >
              {header}
            </Text>
            <ButtonIcon
              iconName={IconName.Close}
              size={ButtonIconSize.Sm}
              onClick={dismiss}
              ariaLabel={t('close')}
              textAlign={TextAlign.Left}
              justifyContent={JustifyContent.flexStart}
              alignItems={AlignItems.flexStart}
              width={BLOCK_SIZES.ONE_TWELFTH}
            />
          </Box>
        </Box>
        {icon && (
          <Box
            display={DISPLAY.FLEX}
            flexDirection={FLEX_DIRECTION.ROW}
            alignItems={AlignItems.center}
            justifyContent={JustifyContent.center}
          >
            {icon()}
          </Box>
        )}
        {image && <img src={image} width="300px" />}
        <Text
          variant={TextVariant.bodyLgMedium}
          textAlign={TextAlign.Center}
          marginTop={4}
          marginBottom={4}
        >
          {title.content}
        </Text>
        {content && (
          <Text
            variant={TextVariant.bodyMd}
            textAlign={TextAlign.Center}
            margin={4}
          >
            {content}
          </Text>
        )}
      </>
      <Box display={DISPLAY.FLEX} flexDirection={FLEX_DIRECTION.COLUMN} gap={4}>
        {buttons.map((btn, idx) => (
          <Button
            key={idx}
            size={BUTTON_SIZES.LG}
            onClick={btn.onClick}
            label={btn.label}
            variant={btn.variant}
          >
            {btn.label}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default QuizContent;
