const MAX = 1000000000

let idCounter = Math.round( Math.random() * MAX )
function createRandomId() {
  idCounter = idCounter % MAX
  return idCounter++
}

module.exports = createRandomId
