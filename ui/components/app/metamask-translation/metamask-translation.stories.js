import React from 'react';
import { select, object } from '@storybook/addon-knobs';
import { groupBy } from 'lodash';
import en from '../../../../app/_locales/en/messages.json';
import MetaMaskTranslation from './metamask-translation';

export default {
  title: 'MetaMaskTranslation',
};

const { keysWithSubstitution, keysWithoutSubstitution } = groupBy(
  Object.keys(en),
  (key) => {
    if (en[key].message.includes('$1')) {
      return 'keysWithSubstitution';
    }
    return 'keysWithoutSubstitution';
  },
);

export const withoutSubstitutions = () => (
  <MetaMaskTranslation
    translationKey={select(
      'translationKey',
      keysWithoutSubstitution,
      keysWithoutSubstitution[0],
    )}
  />
);

export const withSubstitutions = () => (
  <MetaMaskTranslation
    translationKey={select(
      'translationKey',
      keysWithSubstitution,
      keysWithSubstitution[0],
    )}
    variables={object('variables', [])}
  />
);

export const withTemplate = () => (
  <MetaMaskTranslation
    translationKey={select(
      'translationKey',
      keysWithSubstitution,
      keysWithSubstitution[0],
    )}
    variables={[
      {
        element: 'span',
        key: 'link',
        children: {
          element: 'MetaMaskTranslation',
          props: {
            translationKey: select(
              'innerTranslationKey',
              keysWithoutSubstitution,
              keysWithoutSubstitution[0],
            ),
          },
        },
      },
    ]}
  />
);
