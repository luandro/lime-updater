const setupDir = require('./setup-dir')
const backupFile = require('./backup-file')
const execute = require('./ssh-exec')

module.exports = async (ssh, nodeInfo) => {
  console.log("TCL: nodeInfo", nodeInfo)
  const {node} = nodeInfo
  // save config/lime
  const nodeDir = setupDir(node)
  const lime = await backupFile(ssh, '/etc/config/lime', `${nodeDir}/lime`)
  // save config/pirania
  const pirania = await backupFile(ssh, '/etc/config/pirania', `${nodeDir}/pirania`)
  // save config/dropbear
  const dropbear = await backupFile(ssh, '/etc/config/dropbear', `${nodeDir}/dropbear`)
  // save pirania db.csv
  const dbPath = await execute(ssh, 'uci get pirania.base_config.db_path')
  const db = await backupFile(ssh, dbPath, `${nodeDir}/db.csv`)
  // save know_hosts
  const keys = await backupFile(ssh, '/etc/dropbear/authorized_keys', `${nodeDir}/authorized_keys`)
  return {
    lime,
    pirania,
    dropbear,
    db,
    keys,
  }
}
