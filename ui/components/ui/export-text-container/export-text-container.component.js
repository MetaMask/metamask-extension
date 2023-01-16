import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { ButtonSecondary } from '../../component-library';

function ExportTextContainer({ text = '', onClickCopy = null }) {
  const ONE_MINUTE = 1000 * 60;
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard(ONE_MINUTE);

  return (
    <div className="export-text-container">
      <div className="export-text-container__text-container">
        <div className="export-text-container__text notranslate">{text}</div>
      </div>
      <div className="export-text-container__button">
        <div
          className="export-text-container__button export-text-container__button--copy-only"
          onClick={() => {
            if (onClickCopy) {
              onClickCopy();
            }
            handleCopy(text);
          }}
        >
          <ButtonSecondary className="export-text-container__button">
            {copied ? t('copiedExclamation') : t('copyToClipboard')}
          </ButtonSecondary>
        </div>
      </div>
    </div>
  );
}

ExportTextContainer.propTypes = {
  text: PropTypes.string,
  onClickCopy: PropTypes.func,
};

export default React.memo(ExportTextContainer);
