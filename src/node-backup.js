const backupFile = require('./backup-file')
const execute = require('./ssh-exec')

module.exports = async (ssh, nodeInfo, dataDir) => {
  // save config/lime
  let report = {
    error: null,
  }
  const generateReport = await execute(ssh, 'lime-report > /tmp/lime.report')
  if (generateReport.error) {
    report.error = generateReport.error
  } else {
    report = await backupFile(ssh, '/tmp/lime.report', `${dataDir}/lime.report`)
  }
  const createBackup = await execute(ssh, 'sysupgrade -b /tmp/backup-${HOSTNAME}-$(date +%F).tar.gz && ls /tmp/backup-*.tar.gz')
  const backupPath = createBackup.split('\n')[1]
  const backupName = backupPath.split('/tmp/')[1]
  const backup = await backupFile(nodeInfo.node, backupPath, `${dataDir}/${backupName}`)
  return {
    report,
    backup,
  }
}
