const homedir = require('os').homedir()
const appDir = `${homedir}/.libremesh`
const mkdirp = require('mkdirp')

module.exports = async node => {
  try {
    const nodeDir = `${appDir}/${node}`
    await mkdirp.sync(nodeDir)
    return nodeDir
  } catch (error) {
    throw error
  }
}
