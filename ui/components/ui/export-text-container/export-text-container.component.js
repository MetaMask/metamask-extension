import React from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { Icon, ICON_NAMES } from '../../component-library';
import { clearClipboard } from '../../../helpers/utils/util';

function ExportTextContainer({ text = '', onClickCopy = null }) {
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <div className="export-text-container">
      <div className="export-text-container__text-container">
        <div className="export-text-container__text notranslate">{text}</div>
      </div>
      <div className="export-text-container__buttons-container">
        <div
          className="export-text-container__button export-text-container__button--copy"
          onClick={() => {
            if (onClickCopy) {
              onClickCopy();
            }
            handleCopy(text);
            setTimeout(async () => {
              const clipText = await window.navigator.clipboard.readText();
              if (text === clipText) {
                clearClipboard();
              }
            }, 60000);
          }}
        >
          <Icon name={copied ? ICON_NAMES.COPY_SUCCESS : ICON_NAMES.COPY} />
          <div className="export-text-container__button-text">
            {copied ? t('copiedForMinute') : t('copyToClipboard')}
          </div>
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
