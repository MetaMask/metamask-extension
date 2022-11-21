/**
 * The ICON_NAMES object contains all the possible icon names.
 * It is generated using the generateIconNames script in development/generate-icon-names.js
 * and stored in the environment variable ICON_NAMES
 * To add a new icon, add the icon svg file to app/images/icons
 * Ensure the svg has been optimized, is kebab case and starts with "icon-"
 * See "Adding a new icon" in ./README.md for more details
 */

/* eslint-disable prefer-destructuring*/ // process.env is not a standard JavaScript object, so we are not able to use object destructuring
export const ICON_NAMES = JSON.parse(process.env.ICON_NAMES);
