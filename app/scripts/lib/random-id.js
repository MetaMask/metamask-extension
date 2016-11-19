const MAX = Number.MAX_SAFE_INTEGER

let idCounter = Math.round(Math.random() * MAX)
function createRandomId () {
  idCounter = idCounter % MAX
  return idCounter++
}

module.exports = createRandomId
