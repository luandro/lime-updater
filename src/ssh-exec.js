/* eslint-disable no-console */
module.exports = async (ssh, command, cwd, verbose) => {
  if (verbose) console.log(command)
  const exec = await ssh.execCommand(command, {cwd})
  if (exec.stderr) {
    // console.log('STDERR: ' + exec.stderr)
    return {
      error: exec.stderr,
    }
  }
  return exec.stdout
}
