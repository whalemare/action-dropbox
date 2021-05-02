export async function delay(timeout = 1000) {
  return new Promise((resolver) => setTimeout(resolver, timeout))
}
