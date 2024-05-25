import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  Box,
  Text,
  Input,
  Icon,
  IconName,
  IconSize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TextVariant,
  BorderStyle,
  BorderRadius,
  Display,
  BorderColor,
  Color,
  BackgroundColor,
  BlockSize,
  FlexDirection,
  AlignItems,
  JustifyContent,
  TextColor,
} from '../../../helpers/constants/design-system';

export default function RecoveryPhraseChips({
  secretRecoveryPhrase,
  phraseRevealed,
  confirmPhase,
  setInputValue,
  inputValue,
  indicesToCheck,
  hiddenPhrase,
}) {
  const t = useI18nContext();
  const hideSeedPhrase = phraseRevealed === false;
  return (
    <Box
      className="recovery-phrase-chips"
      borderColor={BorderColor.borderMuted}
      borderStyle={BorderStyle.solid}
      padding={4}
      borderWidth={1}
      borderRadius={BorderRadius.Md}
      display={Display.Grid}
      marginBottom={4}
    >
      <Box
        data-testid="recovery-phrase-chips"
        className={classnames('recovery-phrase-chips__chips', {
          'recovery-phrase-chips__chips--hidden': hideSeedPhrase,
        })}
        display={Display.Grid}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        {secretRecoveryPhrase.map((word, index) => {
          const isConfirmPhase =
            confirmPhase && indicesToCheck?.includes(index);
          return (
            <Box
              key={index}
              display={Display.Flex}
              width={BlockSize.Full}
              padding={2}
            >
              <Text>{`${index + 1}.`}</Text>
              {isConfirmPhase ? (
                <Input
                  data-testid={`recovery-phrase-input-${index}`}
                  value={inputValue[index] || ''}
                  onChange={(e) => {
                    setInputValue({ ...inputValue, [index]: e.target.value });
                  }}
                  required
                  borderRadius={BorderRadius.XL}
                  borderWidth={1}
                  borderColor={BorderColor.primaryDefault}
                  backgroundColor={BackgroundColor.backgroundDefault}
                  borderStyle={BorderStyle.solid}
                  paddingTop={1}
                  paddingBottom={1}
                  paddingLeft={2}
                  paddingRight={2}
                  marginLeft={1}
                  marginRight={1}
                  display={Display.Flex}
                  justifyContent={JustifyContent.center}
                  alignItems={AlignItems.center}
                  width={BlockSize.Full}
                />
              ) : (
                <Text
                  data-testid={`recovery-phrase-chip-${index}`}
                  borderRadius={BorderRadius.XL}
                  borderWidth={1}
                  borderColor={BorderColor.borderDefault}
                  borderStyle={BorderStyle.solid}
                  paddingTop={1}
                  paddingBottom={1}
                  paddingLeft={2}
                  paddingRight={2}
                  marginLeft={1}
                  marginRight={1}
                  display={Display.Flex}
                  justifyContent={JustifyContent.center}
                  alignItems={AlignItems.center}
                  width={BlockSize.Full}
                >
                  {word}
                </Text>
              )}
            </Box>
          );
        })}
      </Box>

      {hideSeedPhrase && (
        <Box
          className="recovery-phrase-chips__secret-blocker"
          backgroundColor={BackgroundColor.overlayAlternative}
          height={BlockSize.Full}
          width={BlockSize.Full}
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          padding={4}
          borderRadius={BorderRadius.Sm}
          color={TextColor.overlayInverse}
          gap={2}
        >
          {!hiddenPhrase && (
            <>
              <Icon name={IconName.Eye} size={IconSize.Lg} />
              <Text
                variant={TextVariant.bodyLgMedium}
                color={Color.overlayInverse}
              >
                {t('makeSureNoOneWatching')}
              </Text>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

RecoveryPhraseChips.propTypes = {
  secretRecoveryPhrase: PropTypes.array,
  phraseRevealed: PropTypes.bool,
  confirmPhase: PropTypes.bool,
  setInputValue: PropTypes.func,
  inputValue: PropTypes.object,
  indicesToCheck: PropTypes.array,
  hiddenPhrase: PropTypes.bool,
};
