export default function timeout(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time || 1500)
  })
}
