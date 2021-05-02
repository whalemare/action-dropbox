export async function retry<T>(request: (countLeft: number) => Promise<T>, maxRetryCount = 3): Promise<T> {
  const countLeft = maxRetryCount - 1
  try {
    const response = await request(countLeft)
    return response
  } catch (e) {
    if (maxRetryCount > 0) {
      return retry(request, countLeft)
    } else {
      return Promise.reject(e)
    }
  }
}
