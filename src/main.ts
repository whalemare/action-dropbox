import * as fs from 'fs'

import * as core from '@actions/core'

import { DropboxUploader } from './upload/dropbox/DropboxUploader'
import { uploadBatch } from './upload/uploadBatch'
import { getInputs } from './utils/getInputs'

const { accessToken, destination, file, pattern } = getInputs({
  accessToken: 'string',
  pattern: 'string?',
  file: 'string?',
  destination: 'string?',
})

async function run() {
  const dropbox = DropboxUploader.create({ accessToken })
  const uploadedFiles: string[] = []

  if (pattern) {
    await uploadBatch(pattern, async (file) => {
      const buffer = await fs.promises.readFile(file)
      const fileId = await dropbox.uploadStream({
        buffer,
        destination: destination || file,
        onProgress: (current, total) => {
          const percent = Math.round((current / total) * 100)
          core.info(`Uploading ${percent}%: ${file}`)
        },
      })
      core.info(`Success uploading ${file} -> ${fileId}`)
      uploadedFiles.push(fileId)
    })
  }

  if (file) {
    const fileId = await dropbox.upload({
      file: file,
      destination: destination,
    })
    uploadedFiles.push(fileId)
  }

  return uploadedFiles
}

run()
  .then((files) => {
    core.info('Success')
    core.setOutput('files', files)
  })
  .catch((e) => {
    core.error(e.error)
    core.setFailed(e)
  })
