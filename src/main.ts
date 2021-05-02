import { join } from 'path'

import * as core from '@actions/core'
import globby from 'globby'

import { DropboxUploader } from './upload/dropbox/DropboxUploader'
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
      const files = await globby(pattern)
      await dropbox.uploadFiles(files, destination, {
        onProgress: (current, total, file) => {
          const percent = Math.round((current / total) * 100)
          if (displayProgress) {
            core.info(`Uploading ${percent}%: ${file}`)
          } else if (percent === 100) {
            core.info(`Uploaded: ${file}`)
            files.push(file)
          }
        },
        partSizeBytes: partSizeBytes,
      })
    })
  }

  if (file) {
    await dropbox.upload({
      file: file,
      destination: join(destination, file),
    })
    uploadedFiles.push(file)
  }
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
