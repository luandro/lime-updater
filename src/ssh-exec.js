module.exports = async (ssh, command) => {
  const exec = await ssh.execCommand(command)
  if (exec.stderr) {
    throw ('STDERR: ' + exec.stderr)
  }
  return exec.stdout
}
