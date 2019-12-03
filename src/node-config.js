const putFile = require('./put-file')
const execute = require('./ssh-exec')
const homedir = require('os').homedir()
const appDir = `${homedir}/.libremesh`

module.exports = async (ssh, nodeInfo) => {
  const {node} = nodeInfo
  // const nodeDir = `${appDir}/${node}`
  const nodeDir = `${appDir}/belaelu`
  // put know_hosts
  const keys = await putFile(node, `${nodeDir}/authorized_keys`, '/etc/dropbear/authorized_keys')
  // put config/lime
  const lime = await putFile(node, `${nodeDir}/lime`, '/etc/config/lime')
  // put config/pirania
  const pirania = await putFile(node, `${nodeDir}/pirania`, '/etc/config/pirania')
  // put config/dropbear
  const dropbear = await putFile(node, `${nodeDir}/dropbear`, '/etc/config/dropbear')
  // Apply
  let applied = false
  try {
    await execute(ssh, 'lime-config && lime-apply')
    applied = true
  } catch (error) {
    applied = false
  }
  // put pirania db.csv
  const dbPath = await execute(ssh, 'uci get pirania.base_config.db_path')
  const db = await putFile(node, `${nodeDir}/db.csv`, dbPath)
  return {
    lime,
    pirania,
    dropbear,
    db,
    keys,
    applied,
  }
}
