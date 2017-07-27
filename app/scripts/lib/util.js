module.exports = {
  getStack,
}

function getStack () {
  const stack = new Error('Stack trace generator - not an error').stack
  return stack
}
