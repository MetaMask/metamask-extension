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
]
