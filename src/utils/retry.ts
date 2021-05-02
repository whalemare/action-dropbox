/**
 * Retry request if it failed
 */
export async function shouldRetry<T, E = Error>(
  requestGenerator: (countLeft: number) => Promise<T>,
  isShouldRetry: (error: E) => Promise<boolean>,
  maxRetryCount = 3,
): Promise<T> {
  const countLeft = maxRetryCount - 1
  try {
    const response = await requestGenerator(countLeft)
    return response
  } catch (e) {
    const needRetry = await isShouldRetry(e)
    if (needRetry && maxRetryCount > 0) {
      return shouldRetry(requestGenerator, isShouldRetry, countLeft)
    } else {
      return Promise.reject(e)
    }
  }
}
