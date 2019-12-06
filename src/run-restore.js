const fs = require('fs')
const waitFor = require('./wait-for')
const connect = require('./connect-to-node')
const printUpgradeTable = require('./print-upgrade-table')
const getNodeInfo = require('./get-node-info')
const putFile = require('./put-file')
const execute = require('./ssh-exec')
const runSysupgrade = require('./run-sysupgrade')

async function runRestore(ssh, node) {
  const sysRestore = await runSysupgrade(ssh, node, true)
  console.log("TCL: sysRestore", sysRestore)
  await waitFor(50)
  const restoredSsh = await tryConnect(node.backup.folder)
  console.log("TCL: restoredSsh", restoredSsh)
  if (restoredSsh && !restoredSsh.error) {
    console.log('Success!!! Connected to Node')
    // check if Lime config and no lime-node
    const checkLimeNode = await execute(ssh, 'uci get lime-node.system.hostname')
    console.log("TCL: runRestore -> checkLimeNode", checkLimeNode)
    if (checkLimeNode) {
      return true
    }
    const checkLime = await execute(ssh, 'uci get lime.system.hostname')
    console.log("TCL: runRestore -> checkLime", checkLime)
    const setLimeNode = await execute(ssh, `uci set lime-node.system.hostname=${checkLime} && uci commit && lime-config && lime-apply && wifi`)
    // repeat for all other lime settings

  }
}

module.exports = async ({dir, nodes, latestRevision}) => {
  try {
    let restoringNodes = nodes
    const updateNode = newItem => restoringNodes
    .forEach((r, index) => {
      if (r.node === newItem.node) {
        restoringNodes[index] = {
          ...r,
          ...newItem,
        }
      }
    })
    // read all folders, filter if --nodes
    const folders = await fs.readdirSync(dir)
    restoringNodes = await Promise.all(folders.map(async f => {
      const files = await fs.readdirSync(`${dir}/${f}`)
      const backupFile = files.filter(i => i.split('-')[0] === 'backup')[0]
      if (backupFile) {
        const hostname = backupFile.split('-')[1]
        const splitIp = f.split('.')
        const ip = `${splitIp[0]}.13.${splitIp[2]}.${splitIp[3]}`
        return {
          backup: {
            backup: true,
            file: backupFile,
            folder: f,
          },
          node: hostname,
          ip,
        }
      }
    }))
    if (restoringNodes && nodes) {
      restoringNodes = restoringNodes.reduce((acc, curr) => {
        const exists = nodes.filter(n => n === curr.node || n === curr.ip)[0]
        if (exists) return acc.concat(curr)
        return acc
      }, [])
    }
    printUpgradeTable(restoringNodes, latestRevision)
    /* Get info */
    for (const node of restoringNodes) {
      let connectionTries = 0
      const tryConnect = async host => {
        const ssh = await connect(host)
        if (ssh.error) {
          if (connectionTries > 10) return false
          connectionTries++
          if (process.env.NODE_ENV !== 'development') {
            console.clear()
          }
          console.log('Failed connecting: ', connectionTries)
          await tryConnect()
        }
        return ssh
      }
      const ssh = await tryConnect(node.ip)
      const info = await getNodeInfo(ssh)
      const nodeWithInfo = {
        ...node,
        ...info,
      }
      updateNode(nodeWithInfo)
      printUpgradeTable(restoringNodes, latestRevision)
      const backupFilePath = `${dir}/${nodeWithInfo.backup.folder}/${nodeWithInfo.backup.file}`
      console.log("TCL: backupFilePath", backupFilePath, nodeWithInfo.node, nodeWithInfo.ip)
      const putBackup = await putFile(nodeWithInfo.ip, backupFilePath, `/tmp/${nodeWithInfo.backup.file}`)
      console.log("TCL: putBackup", putBackup)
      if (putBackup) {
        const checkFile = await execute(ssh, 'ls /tmp/backup-*.tar.gz')
        if (!checkFile.error) {
          return runRestore(ssh, nodeWithInfo)
        }
      }
    }
    // ask to continue
    // connect to 10.13.*.*
    // put back-file
    // sysupgrade -r

    return true
  } catch (error) {
    console.log("TCL: error", error)
  }
}
