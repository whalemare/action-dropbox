import * as fs from 'fs/promises'

import { Dropbox } from 'dropbox'

import { Logger } from '../../utils/Logger'
import { UploadArgs, Uploader } from '../Uploader'

import { DropboxUploaderArgs } from './DropboxUploaderArgs'
import { StreamUploader } from './StreamUploader'

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
    try {
      // 150 Mb Dropbox restriction to max file for uploading
      const UPLOAD_FILE_SIZE_LIMIT = 150 * 1024 * 1024
      const destination = `/${uploadArgs.destination || file}`
      const buffer = await fs.readFile(file)

      this.logger?.debug(`Upload ${file} -> ${destination}: ${buffer.length} Bytes`)
      if (buffer.length < UPLOAD_FILE_SIZE_LIMIT) {
        const response = await this.dropbox.filesUpload({
          path: destination,
          contents: buffer,
          mode: { '.tag': 'overwrite' },
        })
        this.logger?.info(`Uploaded: ${file} with id ${response.result.id}`)

        return response.result.id
      } else {
        return this.uploadStream({
          buffer,
          destination,
          onProgress: (uploaded, total) => {
            this.logger?.info(`Uploaded ${(uploaded / total) * 100}% ${file}`)
          },
        })
      }
    } catch (e: unknown) {
      this.logger?.error(e as string)
      throw e
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
   * Upload file larger than 150Mb or for batch uploading
   *
   * @param buffer file content
   * @param destination file name on dropbox. Should be started from /
   * @param onProgress optional function that indicate progress
   * @returns
   */
  uploadStream = async ({ buffer, destination, partSizeBytes = DROPBOX_MAX_BLOB_SIZE, onProgress }: StreamUploader) => {
    const partSize = Math.min(partSizeBytes, DROPBOX_MAX_BLOB_SIZE)

    const blobs = []
    let offset = 0
    while (offset < buffer.length) {
      const chunkSize = Math.min(partSize, buffer.length - offset)
      blobs.push(buffer.slice(offset, offset + chunkSize))
      offset += chunkSize
    }

    const uploadedFileId = await blobs.reduce(async (acc, blob, index, items) => {
      const isStartUploading = index === 0
      if (isStartUploading) {
        onProgress?.(0, buffer.length)

        return acc.then(async () =>
          this.dropbox.filesUploadSessionStart({ contents: blob }).then((response) => response.result.session_id),
        )
      } else if (index < items.length - 1) {
        // Append part to the upload session

        const offset = index * partSize
        onProgress?.(offset, buffer.length)

        return acc.then(async (sessionId: string) => {
          return this.dropbox
            .filesUploadSessionAppendV2({
              // @ts-ignore incorrect cursor typings here, that required `contents`, but crashed in runtime
              cursor: { session_id: sessionId, offset: offset },
              contents: blob,
            })
            .then(() => {
              return sessionId
            })
        })
      } else {
        // Last chunk of data, close session

        const offset = buffer.length - blob.length
        return acc.then(async (sessionId) => {
          return this.dropbox
            .filesUploadSessionFinish({
              // @ts-ignore incorrect cursor typings here, that required `contents`, but crashed in runtime
              cursor: { session_id: sessionId, offset: offset },
              // @ts-ignore incorrect cursor typings here, that required `contents`, but crashed in runtime
              commit: { path: destination, mode: { '.tag': 'overwrite' }, autorename: true, mute: false },
              contents: blob,
            })
            .then((it) => {
              return it.result.id
            })
        })
      }
    }, Promise.resolve(''))

    onProgress?.(buffer.length, buffer.length)
    return uploadedFileId
  }

  constructor(private dropbox: Dropbox, private logger?: Logger) {}
}

// const isDropboxError = is((e) => (typeof e === 'object' && e.error && e.status ? e : undefined))
