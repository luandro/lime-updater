/* eslint-disable no-await-in-loop, no-console, guard-for-in */
const fs = require('fs')
const connectAllIps = require('./connect-all-ips')
const connect = require('./connect-to-node')
const printRestoreTable = require('./print-restore-table')
const getNodeInfo = require('./get-node-info')
const putFile = require('./put-file')
const execute = require('./ssh-exec')

module.exports = async ({dir, nodes, latestRevision}) => {
  let restoringNodes = nodes
  try {
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
    printRestoreTable(restoringNodes, latestRevision)
    /* Get info */
    for (const node of restoringNodes) {
      const ssh = await connectAllIps({
        ip: node.ip,
        oldIp: node.backup.folder,
        hostname: node.node,
      }).catch(error => error.error)
      if (!ssh || ssh.error) {
        const sshErrorNode = {
          ...node,
          restore: {
            error: true,
            file: {error: 'Can\'t connect'},
          },
        }
        updateNode(sshErrorNode)
        printRestoreTable(restoringNodes, latestRevision)
        return restoringNodes
      }
      const info = await getNodeInfo(ssh)
      const nodeWithInfo = {
        ...node,
        ...info,
      }
      updateNode(nodeWithInfo)
      printRestoreTable(restoringNodes, latestRevision)
      const backupFilePath = `${dir}/${nodeWithInfo.backup.folder}/${nodeWithInfo.backup.file}`
      const putBackup = await putFile(nodeWithInfo.ip, backupFilePath, `/tmp/${nodeWithInfo.backup.file}`)
      if (putBackup) {
        const checkFile = await execute(ssh, 'ls /tmp/backup-*.tar.gz')
        if (!checkFile.error) {
          const nodeWithRestore = {
            ...nodeWithInfo,
            restore: {
              file: true,
            },
          }
          updateNode(nodeWithRestore)
          printRestoreTable(restoringNodes, latestRevision)
        }
      } else {
        const nodeWithRestore = {
          ...nodeWithInfo,
          restore: {
            error: true,
            file: {error: putBackup.error},
          },
        }
        updateNode(nodeWithRestore)
        printRestoreTable(restoringNodes, latestRevision)
      }
    }
    return restoringNodes
  } catch (error) {
    return restoringNodes
  }
}
