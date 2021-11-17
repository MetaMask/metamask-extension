import React from 'react';
import PropTypes from 'prop-types';
import Tooltip from '../../../../../ui/tooltip/tooltip';
import CopyIcon from '../../../../../ui/icon/copy-icon.component';

import { useCopyToClipboard } from '../../../../../../hooks/useCopyToClipboard';

const CopyRawData = (data) => {
  const [copied, handleCopy] = useCopyToClipboard();

  return (
    <div className="copy-raw-data">
      <Tooltip position="right" title={copied ? 'Copied!' : ''}>
        <button
          onClick={() => {
            handleCopy(data);
          }}
          className="copy-raw-data__button"
        >
          <div className="copy-raw-data__icon">
            <CopyIcon size={12} color="#BBC0C5" />
          </div>
          <div className="copy-raw-data__label">Copy raw transaction data</div>
        </button>
      </Tooltip>
    </div>
  );
};

CopyRawData.PropTypes = {
  data: PropTypes.string.isRequired,
};

export default CopyRawData;
