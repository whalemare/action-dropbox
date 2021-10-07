import * as fsRaw from 'fs'
import { promises as fs } from 'fs';

import { Dropbox } from 'dropbox'

import { Logger } from '../../utils/Logger'
import { delay } from '../../utils/delay'
import { shouldRetry } from '../../utils/retry'
import { UploadArgs, Uploader } from '../Uploader'

import { DropboxUploaderArgs } from './types/DropboxUploaderArgs'
import { StreamUploader } from './types/StreamUploader'

/**
 * 8Mb - Dropbox JavaScript API suggested max file / chunk size
 */
const DROPBOX_MAX_BLOB_SIZE = 8 * 1000 * 1000

export class DropboxUploader implements Uploader {
  /**
   * Helper function for create DropboxUploader instance with no effort
   *
   * @link https://www.dropbox.com/developers/apps - for get access token
   */
  static create({ accessToken }: DropboxUploaderArgs) {
    return new DropboxUploader(new Dropbox({ accessToken }), console)
  }

  /**
   * Upload file to Dropbox
   */
  upload = async ({ file, ...uploadArgs }: UploadArgs) => {
    // 150 Mb Dropbox restriction to max file for uploading
    const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024
    const destination = uploadArgs.destination || `/${file}`

    // TODO: remove reading file
    const buffer = await fs.readFile(file)

    if (buffer.length <= 0) {
      this.logger?.warn(`Skip file: ${file}, because it size is ${buffer.length}`)
      return ''
    }

    this.logger?.debug(`Upload ${file} -> ${destination}: ${buffer.length} Bytes`)
    if (buffer.length < UPLOAD_FILE_SIZE_LIMIT) {
      const response = await this.dropbox.filesUpload({
        path: destination,
        contents: buffer,
        mode: { '.tag': 'overwrite' },
        autorename: true,
        strict_conflict: false,
      })
      this.logger?.info(`Uploaded: ${file} with id ${response.result.id}`)

      return response.result.id
    } else {
      return this.uploadStream({
        file: file,
        destination,
        onProgress: (uploaded, total) => {
          this.logger?.info(`Uploaded ${(uploaded / total) * 100}% ${file}`)
        },
      })
    }
  }

  /**
   * Upload single file to dropbox
   * Should be lower tnat 150 Mb. If you don't sure about that, just use regular #upload function
   * @param buffer file content
   * @param destination file name on dropbox. Should be started from /
   * @returns
   */
  uploadFile = async (buffer: Buffer, destination: string) => {
    const response = await this.dropbox.filesUpload({
      path: destination,
      contents: buffer,
      mode: { '.tag': 'overwrite' },
    })
    return response.result.id
  }

  /**
   * Upload file larger than 150Mb
   *
   * @param buffer file content
   * @param destination file name on dropbox. Should be started from /
   * @param onProgress optional function that indicate progress
   * @returns
   */
  uploadStream = async ({
    file,
    destination,
    partSizeBytes = DROPBOX_MAX_BLOB_SIZE,
    onProgress,
  }: StreamUploader & UploadArgs) => {
    const fileStream = fsRaw.createReadStream(file, { highWaterMark: partSizeBytes })

    let sessionId: string | undefined = undefined
    let uploaded = 0
    const size = fileStream.readableLength

    for await (const chunk of fileStream) {
      if (uploaded === 0 && chunk.length === 0) {
        break
      }

      if (sessionId === undefined) {
        sessionId = (await this.dropbox.filesUploadSessionStart({ contents: chunk })).result.session_id
      } else {
        await this.dropbox.filesUploadSessionAppendV2({
          // @ts-ignore incorrect cursor typings here, that required `contents`, but crashed in runtime
          cursor: { session_id: sessionId, offset: uploaded },
          contents: chunk,
          close: false,
        })
      }
      onProgress?.(uploaded, size, file)
      uploaded += chunk.length
    }
    if (uploaded > 0) {
      const response = await this.dropbox.filesUploadSessionFinish({
        // @ts-ignore incorrect cursor typings here, that required `contents`, but crashed in runtime
        cursor: { session_id: sessionId, offset: uploaded },
        // @ts-ignore incorrect cursor typings here, that required `contents`, but crashed in runtime
        commit: { path: destination, mode: { '.tag': 'overwrite' } },
        contents: '',
      })
      onProgress?.(uploaded, size, file)
      return response.result.id
    } else {
      onProgress?.(uploaded, size, file)
      this.logger?.warn(`Skip ${file}, because it has empty content`)
      return ''
    }
  }

  /**
   * Batch file uploading
   *
   * @param files
   * @param destination
   */
  uploadFiles = async (
    files: string[],
    destination: string,
    { onProgress, partSizeBytes = DROPBOX_MAX_BLOB_SIZE }: StreamUploader = {},
  ) => {
    this.logger?.info(`Start uploading ${files.length} files`)

    for await (const file of files) {
      onProgress?.(0, 100, file)
      await this.retryWhenTooManyRequests(async () => {
        return this.upload({
          file,
          destination,
        })
      })
      onProgress?.(100, 100, file)
    }
  }

  retryWhenTooManyRequests = async <T>(func: () => Promise<T>) => {
    return shouldRetry<any, { error?: { error?: { retry_after?: number } } }>(
      func,
      async (error) => {
        console.warn(`error = ${JSON.stringify(error)}`)

        if (error.error?.error?.retry_after) {
          console.warn(`Error: ${error}: wait ${error.error?.error?.retry_after}`)
          await delay(error.error?.error?.retry_after)
        } else {
          await delay(1000)
        }

        return true
      },
      5,
    )
  }

  constructor(private dropbox: Dropbox, private logger?: Logger) {}
}
