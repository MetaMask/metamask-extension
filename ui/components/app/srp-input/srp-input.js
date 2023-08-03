import { isValidMnemonic } from '@ethersproject/hdnode';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TextField from '../../ui/text-field';
import { clearClipboard } from '../../../helpers/utils/util';
import { BannerAlert, Text } from '../../component-library';
import Dropdown from '../../ui/dropdown';
import ShowHideToggle from '../../ui/show-hide-toggle';
import {
  TextAlign,
  TextVariant,
  Severity,
} from '../../../helpers/constants/design-system';
import { parseSecretRecoveryPhrase } from './parse-secret-recovery-phrase';

const defaultNumberOfWords = 12;

const hasUpperCase = (draftSrp) => {
  return draftSrp !== draftSrp.toLowerCase();
};

export default function SrpInput({ onChange, srpText }) {
  const [srpError, setSrpError] = useState('');
  const [pasteFailed, setPasteFailed] = useState(false);
  const [draftSrp, setDraftSrp] = useState(
    new Array(defaultNumberOfWords).fill(''),
  );
  const [showSrp, setShowSrp] = useState(
    new Array(defaultNumberOfWords).fill(false),
  );
  const [numberOfWords, setNumberOfWords] = useState(defaultNumberOfWords);

  const t = useI18nContext();

  const onSrpChange = useCallback(
    (newDraftSrp) => {
      let newSrpError = '';
      const joinedDraftSrp = newDraftSrp.join(' ').trim();

      if (newDraftSrp.some((word) => word !== '')) {
        if (newDraftSrp.some((word) => word === '')) {
          newSrpError = t('seedPhraseReq');
        } else if (hasUpperCase(joinedDraftSrp)) {
          newSrpError = t('invalidSeedPhraseCaseSensitive');
        } else if (!isValidMnemonic(joinedDraftSrp)) {
          newSrpError = t('invalidSeedPhrase');
        }
      }

      setDraftSrp(newDraftSrp);
      setSrpError(newSrpError);
      onChange(newSrpError ? '' : joinedDraftSrp);
    },
    [setDraftSrp, setSrpError, t, onChange],
  );

  const toggleShowSrp = useCallback((index) => {
    setShowSrp((currentShowSrp) => {
      const newShowSrp = currentShowSrp.slice();
      if (newShowSrp[index]) {
        newShowSrp[index] = false;
      } else {
        newShowSrp.fill(false);
        newShowSrp[index] = true;
      }
      return newShowSrp;
    });
  }, []);

  const onSrpWordChange = useCallback(
    (index, newWord) => {
      if (pasteFailed) {
        setPasteFailed(false);
      }
      const newSrp = draftSrp.slice();
      newSrp[index] = newWord.trim();
      onSrpChange(newSrp);
    },
    [draftSrp, onSrpChange, pasteFailed],
  );

  const onSrpPaste = useCallback(
    (rawSrp) => {
      const parsedSrp = parseSecretRecoveryPhrase(rawSrp);
      let newDraftSrp = parsedSrp.split(' ');

      if (newDraftSrp.length > 24) {
        setPasteFailed(true);
        return;
      } else if (pasteFailed) {
        setPasteFailed(false);
      }

      let newNumberOfWords = numberOfWords;
      if (newDraftSrp.length !== numberOfWords) {
        if (newDraftSrp.length < 12) {
          newNumberOfWords = 12;
        } else if (newDraftSrp.length % 3 === 0) {
          newNumberOfWords = newDraftSrp.length;
        } else {
          newNumberOfWords =
            newDraftSrp.length + (3 - (newDraftSrp.length % 3));
        }
        setNumberOfWords(newNumberOfWords);
      }

      if (newDraftSrp.length < newNumberOfWords) {
        newDraftSrp = newDraftSrp.concat(
          new Array(newNumberOfWords - newDraftSrp.length).fill(''),
        );
      }
      setShowSrp(new Array(newNumberOfWords).fill(false));
      onSrpChange(newDraftSrp);
      clearClipboard();
    },
    [numberOfWords, onSrpChange, pasteFailed, setPasteFailed],
  );

  const numberOfWordsOptions = [];
  for (let i = 12; i <= 24; i += 3) {
    numberOfWordsOptions.push({
      name: t('srpInputNumberOfWords', [`${i}`]),
      value: `${i}`,
    });
  }

  return (
    <div className="import-srp__container">
      <label className="import-srp__srp-label">
        <Text align={TextAlign.Left} variant={TextVariant.headingSm} as="h4">
          {srpText}
        </Text>
      </label>
      <BannerAlert
        className="import-srp__paste-tip"
        severity={Severity.Info}
        description={t('srpPasteTip')}
        descriptionProps={{ className: 'import-srp__banner-alert-text' }}
      />
      <Dropdown
        className="import-srp__number-of-words-dropdown"
        onChange={(newSelectedOption) => {
          const newNumberOfWords = parseInt(newSelectedOption, 10);
          if (Number.isNaN(newNumberOfWords)) {
            throw new Error('Unable to parse option as integer');
          }

          let newDraftSrp = draftSrp.slice(0, newNumberOfWords);
          if (newDraftSrp.length < newNumberOfWords) {
            newDraftSrp = newDraftSrp.concat(
              new Array(newNumberOfWords - newDraftSrp.length).fill(''),
            );
          }
          setNumberOfWords(newNumberOfWords);
          setShowSrp(new Array(newNumberOfWords).fill(false));
          onSrpChange(newDraftSrp);
        }}
        options={numberOfWordsOptions}
        selectedOption={`${numberOfWords}`}
      />
      <div className="import-srp__srp">
        {[...Array(numberOfWords).keys()].map((index) => {
          const id = `import-srp__srp-word-${index}`;
          return (
            <div key={index} className="import-srp__srp-word">
              <label htmlFor={id} className="import-srp__srp-word-label">
                <Text>{`${index + 1}.`}</Text>
              </label>
              <TextField
                id={id}
                data-testid={id}
                type={showSrp[index] ? 'text' : 'password'}
                onChange={(e) => {
                  e.preventDefault();
                  onSrpWordChange(index, e.target.value);
                }}
                value={draftSrp[index]}
                autoComplete="off"
                onPaste={(event) => {
                  const newSrp = event.clipboardData.getData('text');

                  if (newSrp.trim().match(/\s/u)) {
                    event.preventDefault();
                    onSrpPaste(newSrp);
                  }
                }}
              />
              <ShowHideToggle
                id={`${id}-checkbox`}
                ariaLabelHidden={t('srpWordHidden')}
                ariaLabelShown={t('srpWordShown')}
                shown={showSrp[index]}
                data-testid={`${id}-checkbox`}
                onChange={() => toggleShowSrp(index)}
                title={t('srpToggleShow')}
              />
            </div>
          );
        })}
      </div>
      {srpError ? (
        <BannerAlert
          className="import-srp__srp-error"
          severity={Severity.Danger}
          description={srpError}
          descriptionProps={{ className: 'import-srp__banner-alert-text' }}
        />
      ) : null}
      {pasteFailed ? (
        <BannerAlert
          className="import-srp__srp-too-many-words-error"
          severity={Severity.Danger}
          actionButtonLabel={t('dismiss')}
          actionButtonOnClick={() => setPasteFailed(false)}
          description={t('srpPasteFailedTooManyWords')}
          descriptionProps={{ className: 'import-srp__banner-alert-text' }}
        />
      ) : null}
    </div>
  );
}

SrpInput.propTypes = {
  /**
   * Event handler for SRP changes.
   *
   * This is only called with a valid, well-formated (i.e. exactly one space
   * between each word) SRP or with an empty string.
   *
   * This is called each time the draft SRP is updated. If the draft SRP is
   * valid, this is called with a well-formatted version of that draft SRP.
   * Otherwise, this is called with an empty string.
   */
  onChange: PropTypes.func.isRequired,
  /**
   * Text to show on the left of the Dropdown component. Wrapped in Typography component.
   */
  srpText: PropTypes.string.isRequired,
};
