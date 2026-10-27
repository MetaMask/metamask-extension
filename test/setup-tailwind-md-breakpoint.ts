import {
  TAILWIND_MD_MIN_WIDTH_ENV,
  getTailwindMdMinWidth,
} from '../development/webpack/utils/tailwind-breakpoint';

// Jest does not run the webpack build, so inline the same Tailwind `md`
// breakpoint the extension bundle receives as `process.env.TAILWIND_MD_MIN_WIDTH`.
process.env[TAILWIND_MD_MIN_WIDTH_ENV] = String(getTailwindMdMinWidth());
