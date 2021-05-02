import globby from 'globby'

/**
 * Map pattern to list of files
 * @param src some pattern
 * @param upload function invoked for each file in parallel
 * @returns when all success resolved
 */
export async function uploadBatch<T>(src: string, upload: (file: string) => Promise<T>) {
  const files = await globby(src)

  return Promise.all(
    files.map(async (file) => {
      return upload(file)
    }),
  )
}
