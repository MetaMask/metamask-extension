import { createContext, type ComponentType } from 'react';

type TemplateRendererProps = { sections: unknown };

/**
 * Context that exposes the `MetaMaskTemplateRenderer` component to descendants
 * (notably `MetaMaskTranslation`, which needs to render sub-templates without
 * forming a static import cycle with the renderer).
 *
 * The renderer self-provides this value when it mounts, so any subtree rendered
 * through the renderer can rely on it.
 */
export const TemplateRendererContext =
  createContext<ComponentType<TemplateRendererProps> | null>(null);
