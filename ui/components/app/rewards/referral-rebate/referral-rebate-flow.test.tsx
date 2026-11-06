import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../../test/lib/i18n-helpers';
import { getRebateOfferEndLabel } from './referral-activated-modal';
import { ReferralRebateFlow } from './referral-rebate-flow';

function renderFlow() {
  renderWithProvider(<ReferralRebateFlow />, configureStore(mockState));
}

describe('ReferralRebateFlow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('opens the invite automatically for an existing wallet', () => {
    renderFlow();

    expect(
      screen.getByText(messages.referralRebateInviteTitle.message),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('8F3A21')).toHaveAttribute('readonly');
  });

  it('shows the active offer in the tour modal after accept', () => {
    renderFlow();

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.referralRebateInviteAccept.message,
      }),
    );

    expect(
      screen.queryByText(messages.referralRebateInviteTitle.message),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('referral-rebate-activated-modal'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.referralRebateActivatedTitle.message),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        messages.referralRebateActivatedDescription.message.replace(
          '$1',
          getRebateOfferEndLabel(),
        ),
      ),
    ).toBeInTheDocument();
  });

  it('opens the active offer directly after accepting during onboarding', () => {
    localStorage.setItem('referral-rebate-onboarding-accepted', 'true');

    renderFlow();

    expect(
      screen.queryByText(messages.referralRebateInviteTitle.message),
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId('referral-rebate-activated-modal'),
    ).toBeInTheDocument();
    expect(
      localStorage.getItem('referral-rebate-onboarding-accepted'),
    ).toBeNull();
  });

  it('closes when the person continues without a referral', () => {
    renderFlow();

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.referralRebateInviteSkip.message,
      }),
    );

    expect(
      screen.queryByText(messages.referralRebateInviteTitle.message),
    ).not.toBeInTheDocument();
  });

  it('closes from the active offer actions', () => {
    renderFlow();

    fireEvent.click(
      screen.getByRole('button', {
        name: messages.referralRebateInviteAccept.message,
      }),
    );
    fireEvent.click(
      screen.getByRole('button', {
        name: messages.referralRebateActivatedStartTrading.message,
      }),
    );

    expect(
      screen.queryByTestId('referral-rebate-activated-modal'),
    ).not.toBeInTheDocument();
  });
});
