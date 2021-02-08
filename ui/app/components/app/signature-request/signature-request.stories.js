import React from 'react';
import { action } from '@storybook/addon-actions';
import { text, boolean, number, object } from '@storybook/addon-knobs';
import SignatureRequest from './signature-request.component';
import testData from '../../../../../.storybook/test-data.js'

const primaryAccount = Object.values(testData.metamask.accounts)[0]

const containerStyle = {
  width: '300px',
};

export default {
  title: 'Signature Request',
};

export const FirstLook = () => {
  return (
    <div style={containerStyle}>
      <SignatureRequest
        txData={{
          msgParams: {
            data: JSON.stringify({
              domain: {
                name: 'happydapp.website',
              },
              message: {
                string: 'haay wuurl',
                number: 42,
              },
            }),
            origin: 'https://happydapp.website/governance?futarchy=true',
          },
        }}
        fromAccount={primaryAccount}
        clearConfirmTransaction={() => {}}
        cancel={() => {}}
        sign={() => {}}
      />
    </div>
  );
};
