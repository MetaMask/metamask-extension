const MAX = Number.MAX_SAFE_INTEGER

let idCounter = Math.round(Math.random() * MAX)
export default function createRandomId () {
  idCounter = idCounter % MAX
  return idCounter++
}
