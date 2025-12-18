import React from 'react';
import { render } from '@testing-library/react';
import { TrustSignalDisplayState } from '../../../../../hooks/useTrustSignals';
import * as trustSignalsHooks from '../../../../../hooks/useOriginTrustSignals';
import { ConfirmInfoRowUrl } from './url';

jest.mock('../../../../../hooks/useOriginTrustSignals');

describe('ConfirmInfoRowUrl', () => {
  beforeEach(() => {
    jest.spyOn(trustSignalsHooks, 'useOriginTrustSignals').mockReturnValue({
      state: TrustSignalDisplayState.Unknown,
      label: null,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not render any icon with unknown trust state', () => {
    const { container } = render(
      <ConfirmInfoRowUrl url={'https://example.com'} />,
    );
    expect(container.querySelector('.mm-icon')).not.toBeInTheDocument();
  });

  it('should render danger icon with error color when trust state is malicious', () => {
    jest.spyOn(trustSignalsHooks, 'useOriginTrustSignals').mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });
    const { container } = render(
      <ConfirmInfoRowUrl url={'https://example.com'} />,
    );
    const icon = container.querySelector('.mm-icon');
    expect(icon).toHaveClass('mm-box--color-error-default');
    expect(icon).toHaveStyle({ maskImage: "url('./images/icons/danger.svg')" });
  });

  it('should render danger icon with warning color when trust state is warning', () => {
    jest.spyOn(trustSignalsHooks, 'useOriginTrustSignals').mockReturnValue({
      state: TrustSignalDisplayState.Warning,
      label: null,
    });
    const { container } = render(
      <ConfirmInfoRowUrl url={'https://example.com'} />,
    );
    const icon = container.querySelector('.mm-icon');
    expect(icon).toHaveClass('mm-box--color-warning-default');
    expect(icon).toHaveStyle({ maskImage: "url('./images/icons/danger.svg')" });
  });

  it('should render verified icon with info color when trust state is verified', () => {
    jest.spyOn(trustSignalsHooks, 'useOriginTrustSignals').mockReturnValue({
      state: TrustSignalDisplayState.Verified,
      label: null,
    });
    const { container } = render(
      <ConfirmInfoRowUrl url={'https://example.com'} />,
    );
    const icon = container.querySelector('.mm-icon');
    expect(icon).toHaveClass('mm-box--color-info-default');
    expect(icon).toHaveStyle({
      maskImage: "url('./images/icons/verified-filled.svg')",
    });
  });

  it('renders a URL', () => {
    const { getByText } = render(
      <ConfirmInfoRowUrl url="https://www.example.com" />,
    );
    expect(getByText('www.example.com')).toBeInTheDocument();
  });

  it('renders a URL with a path', () => {
    const { getByText } = render(
      <ConfirmInfoRowUrl url="https://www.example.com/foo" />,
    );
    expect(getByText('www.example.com/foo')).toBeInTheDocument();
  });

  it('renders HTTP warning badge for HTTP URLs when trust state is unknown', () => {
    const { container, getByText } = render(
      <ConfirmInfoRowUrl url="http://www.example.com/" />,
    );
    expect(getByText('www.example.com/')).toBeInTheDocument();
    expect(getByText('HTTP')).toBeInTheDocument();
    expect(container.querySelector('.mm-icon')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('prioritizes malicious state over HTTP warning', () => {
    jest.spyOn(trustSignalsHooks, 'useOriginTrustSignals').mockReturnValue({
      state: TrustSignalDisplayState.Malicious,
      label: null,
    });
    const { container, getByText, queryByText } = render(
      <ConfirmInfoRowUrl url="http://www.example.com/" />,
    );
    expect(getByText('www.example.com/')).toBeInTheDocument();
    expect(queryByText('HTTP')).not.toBeInTheDocument();

    const icon = container.querySelector('.mm-icon');
    expect(icon).toHaveClass('mm-box--color-error-default');
    expect(icon).toHaveStyle({ maskImage: "url('./images/icons/danger.svg')" });
  });
});
