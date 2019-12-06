const mkdirp = require('mkdirp')

module.exports = async (name, dataDir) => {
  try {
    const nodeDir = `${dataDir}/${name}`
    await mkdirp.sync(nodeDir)
    return nodeDir
  } catch (error) {
    throw error
  }
}
