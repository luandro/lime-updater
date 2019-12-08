/* eslint-disable no-await-in-loop, no-console, guard-for-in */
const waitFor = require('./wait-for')
const runSysupgrade = require('./run-sysupgrade')
const connectAllIps = require('./connect-all-ips')
const connect = require('./connect-to-node')
const execute = require('./ssh-exec')
const printRestoreTable = require('./print-restore-table')

async function doSysupgrade(nodes) {
  for (const node of nodes) {
    console.log('Running on node', node.node)
    const ssh = await connectAllIps({
      ip: node.ip,
      oldIp: node.backup.folder,
      hostname: node.node,
    })
    await runSysupgrade(ssh, node, true)
    await waitFor(60 / nodes.length, true)
    return true
  }
}

async function checkRestore(nodes) {
  let restoredNodes = nodes
  const updateNode = newItem => restoredNodes
  .forEach((r, index) => {
    if (r.node === newItem.node) {
      restoredNodes[index] = {
        ...r,
        ...newItem,
      }
    }
  })
  return Promise.all(nodes.map(async node => {
    const ssh = await connectAllIps({
      ip: node.ip,
      oldIp: node.backup.folder,
      hostname: node.node,
    })
    if (ssh && !ssh.error) {
      // check if Lime config and no lime-node
      const oldLimeConfig = await execute(ssh, 'uci show lime')
      if (oldLimeConfig) {
        const oldConfList = oldLimeConfig.split('\n')
        for (const conf of oldConfList) {
          const config = conf.split('lime.')[1]
          switch (conf.split('=')[0]) {
          case 'lime.system.hostname':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          case 'lime.wifi.modes':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          case 'lime.wifi.adhoc_mcast_rate_5ghz':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          case 'lime.wifi.distance_5ghz':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          case 'lime.wifi.channel_5ghz':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          case 'lime.wifi.channel_2ghz':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          case 'lime.wifi.distance_2ghz':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          case 'lime.wifi.adhoc_mcast_rate_2ghz':
            execute(ssh, `uci set lime-node.${config}`, null, true)
            break
          default:
            execute(ssh, `uci set lime-community.${config}`, null, true)
            break
          }
        }
        await execute(ssh, 'uci commit && lime-config && lime-apply && wifi && rm /etc/config/lime', null, true)
      }
      const restoredNode = {
        ...node,
        restore: {
          done: true,
        },
      }
      updateNode(restoredNode)
      printRestoreTable(restoredNodes)
      return restoredNodes
    }
    const restoredNode = {
      ...node,
      restore: {
        done: {
          error: true,
        },
      },
    }
    updateNode(restoredNode)
    printRestoreTable(restoredNodes)
    return restoredNodes
  }))
}

module.exports = async nodes => {
  try {
    await doSysupgrade(nodes)
    const restoredNodes = await checkRestore(nodes)
    return restoredNodes
  } catch (error) {
    console.log('An error ocurred while restoring nodes', error)
    return error
  }
}
