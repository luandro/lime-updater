/* eslint-disable no-console */

module.exports = async (ssh, node, restore) => {
  let backup = node
  const msg = restore ? 'Restoring backup...' : 'Executing sysupgrade...'
  try {
    console.log(msg)
    const opts = restore ? ['-r', node.backup.file] : ['-n', node.firmware]
    await ssh.exec('sysupgrade', opts, {cwd: '/tmp'}, {
      async onStdout(chunk) {
        const data = chunk.toString('utf8')
        console.log("TCL: onStdout -> data", data)
      },
      onStderr(chunk) {
        console.log("TCL: onStderr -> chunk", chunk)
        // console.log('stderrChunk ================> ', chunk.toString('utf8'))
      },
    })
    backup.upgrade = true
    return backup
  } catch (error) {
    console.log('Error while upgrading', error)
    return {
      ...backup,
      sysupgrade: {
        error,
      },
    }
  }
}
