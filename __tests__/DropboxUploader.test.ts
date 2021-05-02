import globby from 'globby'

import { DropboxUploader } from '../src/upload/dropbox/DropboxUploader'

/**
 * You can get new one at
 *
 * should have files.write permission
 * @link https://www.dropbox.com/developers/apps
 */
const ACCESS_TOKEN = 'Cms2dEbdMIsAAAAAAAAAAavdNFDJ0yalT_GQcbY5GWcXghNm-4rikfZmfycs8lL7'

describe('upload', () => {
  const file = '__tests__/shouldRetry.test.ts'

  test(
    'should upload file without effort',
    async () => {
      const uploader = DropboxUploader.create({
        accessToken: ACCESS_TOKEN,
        logger: console,
      })

      const result = await uploader.upload({
        file: '__tests__/shouldRetry.test.ts',
      })

      expect(result).toBeTruthy()
    },
    60 * 1000,
  )

  test(
    'should upload stream file',
    async () => {
      const uploader = DropboxUploader.create({
        accessToken: ACCESS_TOKEN,
        logger: console,
      })

      try {
        const result = await uploader.uploadStream({
          file: file,
          partSizeBytes: 100,
          destination: `/${file}`,
          onProgress: (uploaded, total) => {
            console.log(`onProgress: ${uploaded}/${total}`)
          },
        })
        expect(result).toBeTruthy()
      } catch (e) {
        console.error(e.error)
      }
    },
    60 * 1000,
  )

  test(
    'should upload stream files blob',
    async () => {
      const uploader = DropboxUploader.create({
        accessToken: ACCESS_TOKEN,
        logger: console,
      })

      const result = await uploader.uploadStream({
        file: file,
        destination: `/${file}`,
        partSizeBytes: 100,
        onProgress: (uploaded, total) => {
          console.log(`onProgress: ${uploaded}/${total}`)
        },
      })

      expect(result).toBeTruthy()
    },
    60 * 1000,
  )
  test(
    'upload batch files',
    async () => {
      const uploader = DropboxUploader.create({
        accessToken: ACCESS_TOKEN,
        logger: console,
      })

      const files = await globby('src/**/*')
      try {
        await uploader.uploadFiles(files, '/test')
      } catch (e) {
        console.error(e.error)
      }
    },
    60 * 1000,
  )
})
