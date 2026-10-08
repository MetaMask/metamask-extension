import React from 'react';
import { render, screen } from '@testing-library/react';
import { en, I18nProvider } from '../../../test/lib/render-helpers-navigate';
import { DeepLinkNotFound } from './deep-link-not-found';

const renderPage = () => {
  global.platform.getExtensionURL = (route = '/') => `home.html#${route}`;

  return render(
    <I18nProvider currentLocale="en" current={en} en={en}>
      <DeepLinkNotFound />
    </I18nProvider>,
  );
};

describe('DeepLinkNotFound', () => {
  it('shows the missing-page message and a link home', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { name: "This page doesn't exist" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We can't find the page you are looking for."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Go to the home page' }),
    ).toHaveAttribute('href', 'home.html#/');
  });
});
