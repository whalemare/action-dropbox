import { retry } from '../src/utils/retry'

it('retry return data when success', async () => {
  let counter = 0
  const result = await retry(
    async () => {
      counter++
      return 'data'
    },
    async (it) => Promise.resolve(true),
  )
  expect(result).toBe('data')
  expect(counter).toBe(1) // should be only one request, because first is success
})

it(`retry should fail when to much errors`, async () => {
  let counter = 0
  try {
    await retry(
      async () => {
        counter++
        throw 'error ' + counter
      },
      async (it) => Promise.resolve(true),
      3,
    )
  } catch (e) {
    expect(e).toBe('error 4')
    return
  }

  throw 'This should not be invoked'
})

it(`retry should fail when isretry return false`, async () => {
  let counter = 0
  try {
    await retry(
      async () => {
        counter++
        throw 'error ' + counter
      },
      async (it) => Promise.resolve(false),
      3,
    )
  } catch (e) {
    expect(e).toBe('error 1')
    return
  }

  throw 'This should not be invoked'
})
