import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import PasskeyPrfMigration from './passkey-prf-migration';

const mockNavigate = jest.fn();
const mockSetupPasskeyContent = jest.fn(
  ({ onNext }: { onNext: () => void }) => (
    <button data-testid="mock-setup-passkey-content" onClick={onNext}>
      Set up passkey
    </button>
  ),
);

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock(
  '../../../components/app/passkey-setup/setup-passkey-content',
  () => ({
    // eslint-disable-next-line @typescript-eslint/naming-convention -- Jest ESM interop
    __esModule: true,
    default: (props: { onNext: () => void }) => mockSetupPasskeyContent(props),
  }),
);

describe('PasskeyPrfMigration', () => {
  const store = configureMockStore([thunk])({
    metamask: {
      isUnlocked: true,
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the migration prompt', () => {
    const { getByTestId, getByText } = renderWithProvider(
      <PasskeyPrfMigration />,
      store,
      '/onboarding/passkey-prf-migration',
    );

    expect(
      getByTestId('parent-selector-passkey-prf-migration'),
    ).toBeInTheDocument();
    expect(
      getByText(messages.passkeyMigrationTitle.message),
    ).toBeInTheDocument();
    expect(getByTestId('passkey-migration-replace-button')).toBeInTheDocument();
    expect(
      getByTestId('passkey-migration-remind-me-later-button'),
    ).toBeInTheDocument();
  });

  it('navigates to the original destination when the user chooses remind me later', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyPrfMigration />,
      store,
      '/onboarding/passkey-prf-migration',
    );

    fireEvent.click(getByTestId('passkey-migration-remind-me-later-button'));

    expect(mockNavigate).toHaveBeenCalledWith(DEFAULT_ROUTE, { replace: true });
  });

  it('shows the shared PRF migration setup content after replacement starts', () => {
    const { getByTestId } = renderWithProvider(
      <PasskeyPrfMigration />,
      store,
      '/onboarding/passkey-prf-migration',
    );

    fireEvent.click(getByTestId('passkey-migration-replace-button'));

    expect(mockSetupPasskeyContent).toHaveBeenCalledWith(
      expect.objectContaining({
        isPasskeyRegistered: false,
        checkPasskeyPRFSupport: false,
        isPrfMigration: true,
      }),
    );
  });
});
