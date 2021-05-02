import * as fsRaw from 'fs'

const fs = fsRaw.promises

import { DropboxUploader } from '../src/upload/dropbox/DropboxUploader'
import { uploadBatch } from '../src/upload/uploadBatch'

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
    'should upload batch files',
    async () => {
      const uploader = DropboxUploader.create({
        accessToken: ACCESS_TOKEN,
        logger: console,
      })

      await uploadBatch('src/**/*', async (file: string) => {
        await uploader.uploadStream({
          file: file,
          destination: `/${file}`,
          partSizeBytes: 500,
          onProgress: (uploaded, total) => {
            if (uploaded === 0) {
              console.log(`onStart ${file}: ${uploaded}/${total}`)
            } else if (uploaded === total) {
              console.log(`onFinish ${file}: ${uploaded}/${total}`)
            }
          },
        })
      })

      expect(true).toBeTruthy()
    },
    60 * 1000,
  )

  // test('download', () => {
  //   new Dropbox({accessToken}).
  // })
})
