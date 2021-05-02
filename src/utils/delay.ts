export async function delay(timeout = 1000) {
  if (timeout === 0) return Promise.resolve()
  console.warn(`delay ${timeout}`)
  return new Promise((resolver) => setTimeout(resolver, timeout))
}
