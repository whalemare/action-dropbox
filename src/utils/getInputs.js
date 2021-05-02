import * as core from '@actions/core'

export function getInputs(raw) {
  return Object.keys(raw).reduce((total, key) => {
    const rawType = raw[key]
    if (rawType === 'boolean' || rawType === 'boolean?') {
      total[key] = Boolean(core.getInput(key))
    } else if (rawType === 'number' || rawType === 'number?') {
      total[key] = Number.parseFloat(core.getInput(key))
    } else {
      total[key] = core.getInput(key)
    }
    return total
  }, {})
}
