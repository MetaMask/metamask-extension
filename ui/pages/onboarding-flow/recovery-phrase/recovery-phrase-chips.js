import React from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Chip from '../../../components/ui/chip';
import Box from '../../../components/ui/box';
import Typography from '../../../components/ui/typography';
import { ChipWithInput } from '../../../components/ui/chip/chip-with-input';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  TYPOGRAPHY,
  COLORS,
  BORDER_STYLE,
  SIZES,
  DISPLAY,
} from '../../../helpers/constants/design-system';

export default function RecoveryPhraseChips({
  seedPhrase,
  seedPhraseRevealed,
  confirmPhase,
  setInputValue,
  inputValue,
  indicesToCheck,
}) {
  const t = useI18nContext();
  const hideSeedPhrase = seedPhraseRevealed === false;
  return (
    <Box
      borderColor={COLORS.UI2}
      borderStyle={BORDER_STYLE.SOLID}
      padding={4}
      borderWidth={1}
      borderRadius={SIZES.MD}
      display={DISPLAY.GRID}
      marginBottom={4}
      className="recovery-phrase__secret"
    >
      <div
        className={classnames('recovery-phrase__chips', {
          'recovery-phrase__chips--hidden': hideSeedPhrase,
        })}
      >
        {seedPhrase.map((word, index) => {
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
                  borderColor={COLORS.PRIMARY1}
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
              <Chip className="recovery-phrase__chip" borderColor={COLORS.UI3}>
                {word}
              </Chip>
            </div>
          );
        })}
      </div>

      {hideSeedPhrase && (
        <div className="recovery-phrase__secret-blocker">
          <i className="far fa-eye-slash" color="white" />
          <Typography
            variant={TYPOGRAPHY.H6}
            color={COLORS.WHITE}
            className="recovery-phrase__secret-blocker--text"
          >
            {t('makeSureNoOneWatching')}
          </Typography>
        </div>
      )}
    </Box>
  );
}

RecoveryPhraseChips.propTypes = {
  seedPhrase: PropTypes.array,
  seedPhraseRevealed: PropTypes.bool,
  confirmPhase: PropTypes.bool,
  setInputValue: PropTypes.func,
  inputValue: PropTypes.string,
  indicesToCheck: PropTypes.array,
};
