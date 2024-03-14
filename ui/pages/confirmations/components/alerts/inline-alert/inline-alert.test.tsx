import * as React from 'react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers';
import { Severity } from '../../../../../helpers/constants/design-system';
import InlineAlert from './inline-alert';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => jest.fn(),
}));

const ADDRESS_NO_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54977';
const ADDRESS_SAVED_NAME_MOCK = '0xc0ffee254729296a45a3885639ac7e10f9d54979';
const CHAIN_ID_MOCK = '0x1';
const ADDRESS_LABEL = 'address';

const STATE_MOCK = {
  metamask: {
    providerConfig: {
      chainId: CHAIN_ID_MOCK,
    },
  },
};

describe('Inline Alert', () => {
  const store = configureStore()(STATE_MOCK);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('renders alert with danger severity', () => {
    const { container } = renderWithProvider(
      <InlineAlert
        value={ADDRESS_NO_SAVED_NAME_MOCK}
        label={ADDRESS_LABEL}
        severity={Severity.Danger}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders alert with warning severity', () => {
    const { container } = renderWithProvider(
      <InlineAlert
        value={ADDRESS_SAVED_NAME_MOCK}
        label={ADDRESS_LABEL}
        severity={Severity.Warning}
      />,
      store,
    );

    expect(container).toMatchSnapshot();
  });

  it('renders alert with informative severity', () => {
    const { container } = renderWithProvider(
      <InlineAlert value={ADDRESS_SAVED_NAME_MOCK} label={ADDRESS_LABEL} />,
      store,
    );

    expect(container).toMatchSnapshot();
  });
});
