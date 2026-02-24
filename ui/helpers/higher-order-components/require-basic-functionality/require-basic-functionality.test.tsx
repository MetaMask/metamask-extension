import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { render } from '@testing-library/react';
import { SWAP_PATH } from '../../constants/routes';
import { getMessage } from '../../utils/i18n-helper';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import messages from '../../../../app/_locales/en/messages.json';
import BasicFunctionalityRequired from './require-basic-functionality';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockUseLocation = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockUseLocation(),
    Navigate: jest.fn(({ to, state }) => (
      <div
        data-testid="navigate"
        data-to={to}
        data-state={JSON.stringify(state)}
      />
    )),
  };
});

const mockUseSelector = jest.mocked(useSelector);

const CHILD_MESSAGE_KEY = 'basicFunctionalityRequired_title';
const childText = getMessage('en', messages, CHILD_MESSAGE_KEY) as string;

const testChild = <span>{childText}</span>;

describe('BasicFunctionalityRequired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: SWAP_PATH,
      state: null,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>);
  });

  describe('when useExternalServices is true', () => {
    it('renders children', () => {
      mockUseSelector.mockReturnValue(true);

      const { getByText, queryByTestId } = render(
        <BasicFunctionalityRequired>{testChild}</BasicFunctionalityRequired>,
      );

      expect(getByText(childText)).toBeInTheDocument();
      expect(queryByTestId('navigate')).not.toBeInTheDocument();
    });
  });

  describe('when useExternalServices is undefined (e.g. during hydration or old state)', () => {
    it('redirects to basic-functionality-off to be conservative', () => {
      mockUseSelector.mockReturnValue(undefined);

      const { getByTestId, queryByText } = render(
        <BasicFunctionalityRequired>{testChild}</BasicFunctionalityRequired>,
      );

      expect(getByTestId('navigate')).toBeInTheDocument();
      expect(getByTestId('navigate')).toHaveAttribute(
        'data-to',
        '/basic-functionality-off',
      );
      expect(queryByText(childText)).not.toBeInTheDocument();
    });
  });

  describe('when useExternalServices is false', () => {
    const basicFunctionalityOffRoute = '/basic-functionality-off';

    it('redirects to the basic functionality off page', () => {
      mockUseSelector.mockReturnValue(false);

      const { getByTestId, queryByText } = render(
        <BasicFunctionalityRequired>{testChild}</BasicFunctionalityRequired>,
      );

      expect(getByTestId('navigate')).toBeInTheDocument();
      expect(getByTestId('navigate')).toHaveAttribute(
        'data-to',
        basicFunctionalityOffRoute,
      );
      expect(queryByText(childText)).not.toBeInTheDocument();
    });

    it('uses replace navigation', () => {
      mockUseSelector.mockReturnValue(false);

      render(
        <BasicFunctionalityRequired>{testChild}</BasicFunctionalityRequired>,
      );

      expect(Navigate).toHaveBeenCalledWith(
        expect.objectContaining({
          to: basicFunctionalityOffRoute,
          replace: true,
        }),
        expect.anything(),
      );
    });

    it('passes current location pathname and feature name i18n key in state', () => {
      mockUseSelector.mockReturnValue(false);
      mockUseLocation.mockReturnValue({
        pathname: SWAP_PATH,
        state: null,
        key: '',
        search: '',
        hash: '',
      } as ReturnType<typeof useLocation>);

      const { getByTestId } = render(
        <BasicFunctionalityRequired openPageCtaMessageKey="basicFunctionalityRequired_openSwapsPage">
          {testChild}
        </BasicFunctionalityRequired>,
      );

      const stateJson = getByTestId('navigate').getAttribute('data-state');
      const state = stateJson ? JSON.parse(stateJson) : undefined;
      expect(state).toStrictEqual({
        blockedRoutePath: SWAP_PATH,
        openPageCtaMessageKey: 'basicFunctionalityRequired_openSwapsPage',
      });
    });

    it('includes search and hash in blockedRoutePath so original URL context is restored', () => {
      mockUseSelector.mockReturnValue(false);
      mockUseLocation.mockReturnValue({
        pathname: SWAP_PATH,
        state: null,
        key: '',
        search: '?swaps=true',
        hash: '#section',
      } as ReturnType<typeof useLocation>);

      const { getByTestId } = render(
        <BasicFunctionalityRequired openPageCtaMessageKey="basicFunctionalityRequired_openSwapsPage">
          {testChild}
        </BasicFunctionalityRequired>,
      );

      const stateJson = getByTestId('navigate').getAttribute('data-state');
      const state = stateJson ? JSON.parse(stateJson) : undefined;
      expect(state.blockedRoutePath).toBe(`${SWAP_PATH}?swaps=true#section`);
    });
  });
});
