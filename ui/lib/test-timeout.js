export default function timeout (time) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, time || 1500)
  })
}
