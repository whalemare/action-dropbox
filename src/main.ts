import * as core from '@actions/core'

import { wait } from './wait'

const accessToken = core.getInput('access_token')

async function run() {
  const ms: string = core.getInput('milliseconds')
  core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_RUNNER_DEBUG` to true

  core.debug(new Date().toTimeString())
  await wait(parseInt(ms, 10))
  core.debug(new Date().toTimeString())

  core.setOutput('time', new Date().toTimeString())
}

run()
  .then(() => {
    core.info('Success')
    core.setOutput('files', '')
  })
  .catch((e) => {
    core.error(e)
    core.setFailed(e)
  })
