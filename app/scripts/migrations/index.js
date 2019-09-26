/* The migrator has two methods the user should be concerned with:
 *
 * getData(), which returns the app-consumable data object
 * saveData(), which persists the app-consumable data object.
 */

// Migrations must start at version 1 or later.
// They are objects with a `version` number
// and a `migrate` function.
//
// The `migrate` function receives the previous
// config data format, and returns the new one.

module.exports = [
  require('./002'),
  require('./003'),
  require('./004'),
  require('./005'),
  require('./006'),
  require('./007'),
  require('./008'),
  require('./009'),
  require('./010'),
  require('./011'),
  require('./012'),
  require('./013'),
  require('./014'),
  require('./015'),
  require('./016'),
  require('./017'),
  require('./018'),
  require('./019'),
  require('./020'),
  require('./021'),
  require('./022'),
  require('./023'),
  require('./024'),
  require('./025'),
  require('./026'),
  require('./027'),
  require('./028'),
  require('./029'),
  require('./030'),
  require('./031'),
  require('./032'),
  require('./033'),
  require('./034'),
  require('./035'),
  require('./036'),
  require('./037'),
  require('./038'),
]
