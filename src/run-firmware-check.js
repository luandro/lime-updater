const connectToNode = require('./connect-to-node')
const putFile = require('./put-file')
const execute = require('./ssh-exec')
const printUpgradeTable = require('./print-upgrade-table')

async function findAndCheckFirmware(nodes, firmwarePath) {
  let upgradingNodes = nodes
  const updateNode = newItem => upgradingNodes
  .map(r => {
    if (r.node === newItem.node) {
      return newItem
    }
    return r
  })
  printUpgradeTable(upgradingNodes)
  for (const node of nodes) {
    const targets = node.board.release.target.split('/')
    let boardName
    switch (node.board.board_name) {
    case 'tl-wdr3500':
      boardName = 'tl-wdr3500-v1'
      break
    case 'tl-wdr4300':
      boardName = 'tl-wdr4300-v1'
      break
    default:
      boardName = node.board.board_name
      break
    }
    const fileDir = `${firmwarePath}/targets/${targets[0]}/${targets[1]}`
    const firmwareName = `openwrt-${targets[0]}-${targets[1]}-${boardName}-squashfs-sysupgrade.bin`
    const firmwareFile = `${fileDir}/${firmwareName}`
    // const checkSumFile = await fs.readFileSync(`${fileDir}/sha256sums`)
    // console.log("TCL: findAndCheckFirmware -> checkSumFile", checkSumFile)
    const putFirmware = await putFile(node.node, firmwareFile, `/tmp/${firmwareName}`)
    const putCheckSum = await putFile(node.node, `${fileDir}/sha256sums`, '/tmp/sha256sums')
    if (putFirmware && putCheckSum) {
      const ssh = await connectToNode(node.node)
      const checkSum = await execute(ssh, 'sha256sum -c sha256sums 2> /dev/null | grep OK', '/tmp')
      let firmware = {
        error: null
      }
      const checkSumOk = checkSum.includes('OK')
      firmware = checkSumOk ? firmwareName : {error: 'Not ok'}
      upgradingNodes = updateNode({
        ...node,
        firmware,
      })
      printUpgradeTable(upgradingNodes)
    }
  }
  printUpgradeTable(upgradingNodes)
  return upgradingNodes
}

module.exports = async (nodes, firmwarePath, latestRevision) => {
  if (firmwarePath)  {
    if (firmwarePath.includes('http')) {
      console.log('External url still not supported.')
    } else {
      try {
        let promptContinue = true
        if (promptContinue) {
          promptContinue = false
          const upgrade = await findAndCheckFirmware(nodes, firmwarePath)
          // sysupgrade
          // wait 60secs
          // scp backup-*.tar.gz root@openwrt.lan:/tmp
          // ls /tmp/backup-*.tar.gz
          // sysupgrade -r /tmp/backup-*.tar.gz
          // prompt for continue
          // for (const node of nodes) {
          // }
          return upgrade
        }
      } catch (error) {
        throw error
      }
    }
  } else {
    console.log('Must especify a path for the firmware')
    return false
  }
}
