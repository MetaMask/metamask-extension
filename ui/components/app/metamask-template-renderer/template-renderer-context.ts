import React from 'react';

/**
 * Context to inject the template renderer component into MetaMaskTranslation.
 * Breaks the circular dependency: MetaMaskTranslation no longer imports
 * MetaMaskTemplateRenderer directly; it gets the renderer from this context.
 */
export type TemplateRendererComponent = React.ComponentType<{
  sections: unknown;
}>;

export const TemplateRendererContext =
  React.createContext<TemplateRendererComponent | null>(null);
