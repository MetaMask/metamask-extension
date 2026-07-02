import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Layout for routes that must span the full viewport width.
 *
 * Unlike {@link RootLayout}, this layout intentionally omits the
 * `max-w-[clamp(...)]` constraint so expanded experiences (e.g. the perps
 * expanded trading view rendered in a browser tab) can use the entire
 * available width. It renders the matched child route via `<Outlet />`.
 */
export const FullWidthLayout = () => {
  return (
    <div className="w-full h-full flex flex-col">
      <Outlet />
    </div>
  );
};
