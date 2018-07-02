export default function wait (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve()
    }, time * 3 || 1500)
  })
}
