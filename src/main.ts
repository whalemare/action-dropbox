import { join } from 'path'

import * as core from '@actions/core'

import { DropboxUploader } from './upload/dropbox/DropboxUploader'
import { uploadBatch } from './upload/uploadBatch'
import { getInputs } from './utils/getInputs'

const { accessToken, file, destination, pattern, displayProgress = false, partSizeBytes = 1024 } = getInputs({
  accessToken: 'string',
  pattern: 'string?',
  file: 'string?',
  destination: 'string',
  displayProgress: 'boolean?',
  partSizeBytes: 'number?',
})

async function run() {
  const dropbox = DropboxUploader.create({ accessToken })
  const uploadedFiles: string[] = []

  core.startGroup('input args')
  core.info(`pattern ${pattern}`)
  core.info(`file ${file}`)
  core.info(`destination ${destination}`)
  core.info(`displayProgress ${displayProgress ? 'true' : 'false'}`)
  core.info(`partSizeBytes ${partSizeBytes}`)
  core.endGroup()

  if (pattern) {
    await core.group(`uploading batch ${pattern}`, async () => {
      return uploadBatch(pattern, async (file) => {
        const fileId = await dropbox.uploadStream({
          file,
          partSizeBytes: partSizeBytes,
          destination: join(destination, file),
          onProgress: displayProgress
            ? (current, total) => {
                const percent = Math.round((current / total) * 100)
                core.info(`Uploading ${percent}%: ${file}`)
              }
            : undefined,
        })
        core.info(`Uploaded: ${file} -> ${fileId}`)
        uploadedFiles.push(fileId)
      })
    })
  }

  if (file) {
    const fileId = await dropbox.upload({
      file: file,
      destination: join(destination, file),
    })
    uploadedFiles.push(fileId)
  }

  return uploadedFiles
}

run()
  .then((files) => {
    core.info(`Success ${JSON.stringify(files)}`)
    core.setOutput('files', files)
  })
  .catch((e) => {
    core.error(e.error)
    core.setFailed(e)
  })
