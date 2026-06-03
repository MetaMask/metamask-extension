import React from 'react';
import type { ToggleItemConfig } from './create-toggle-item';

/**
 * Creates a formatDescription function that includes a "Learn more" link.
 * Use with createToggleItem's formatDescription option.
 *
 * @param descriptionKey - i18n key for the description text (should contain $1 placeholder for link)
 * @param href - URL for the learn more link
 * @returns A formatDescription function compatible with ToggleItemConfig
 */
export const createDescriptionWithLearnMore =
  (
    descriptionKey: string,
    href: string,
  ): ToggleItemConfig['formatDescription'] =>
  (t) =>
    t(descriptionKey, [
      <a
        key="learn_more_link"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
        className="font-medium text-primary-default"
      >
        {t('learnMoreUpperCase')}
      </a>,
    ]);
