const fs = require('fs')
const execute = require('./ssh-exec')

module.exports = async (ssh, remoteFile, locaFile) => {
  try {
    const getFile = await execute(ssh, `cat ${remoteFile}`)
    await fs.writeFileSync(locaFile, getFile)
    return true
  } catch (error) {
    // throw error
    return null
  }
}
