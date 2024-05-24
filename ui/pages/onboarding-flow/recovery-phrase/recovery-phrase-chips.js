import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import {
  Box,
  Text,
  Tag,
  Icon,
  IconName,
} from '../../../components/component-library';
import { ChipWithInput } from '../../../components/ui/chip/chip-with-input';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TextVariant,
  BorderStyle,
  BorderRadius,
  Display,
  BorderColor,
  Color,
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
      borderColor={BorderColor.borderMuted}
      borderStyle={BorderStyle.solid}
      padding={4}
      borderWidth={1}
      borderRadius={BorderRadius.Md}
      display={Display.Grid}
      marginBottom={4}
      className="recovery-phrase__secret"
    >
      <div
        data-testid="recovery-phrase-chips"
        className={classnames('recovery-phrase__chips', {
          'recovery-phrase__chips--hidden': hideSeedPhrase,
        })}
      >
        {secretRecoveryPhrase.map((word, index) => {
          if (
            confirmPhase &&
            indicesToCheck &&
            indicesToCheck.includes(index)
          ) {
            return (
              <div className="recovery-phrase__chip-item" key={index}>
                <div className="recovery-phrase__chip-item__number">
                  {`${index + 1}.`}
                </div>
                <ChipWithInput
                  dataTestId={`recovery-phrase-input-${index}`}
                  borderColor={BorderColor.primaryDefault}
                  className="recovery-phrase__chip--with-input"
                  inputValue={inputValue[index]}
                  setInputValue={(value) => {
                    setInputValue({ ...inputValue, [index]: value });
                  }}
                />
              </div>
            );
          }
          return (
            <div className="recovery-phrase__chip-item" key={index}>
              <div className="recovery-phrase__chip-item__number">
                {`${index + 1}.`}
              </div>
              <Tag
                label={word}
                data-testid={`recovery-phrase-chip-${index}`}
                className="recovery-phrase__chip"
                borderColor={BorderColor.borderDefault}
                marginLeft={1}
                marginRight={1}
              />
            </div>
          );
        })}
      </div>

      {hideSeedPhrase && (
        <div className="recovery-phrase__secret-blocker">
          {!hiddenPhrase && (
            <>
              <Icon name={IconName.EyeSlash} />
              <Text
                variant={TextVariant.bodyMd}
                color={Color.overlayInverse}
                className="recovery-phrase__secret-blocker--text"
              >
                {t('makeSureNoOneWatching')}
              </Text>
            </>
          )}
        </div>
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
