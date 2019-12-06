module.exports = async (ssh, command, cwd) => {
  const exec = await ssh.execCommand(command, {cwd})
  if (exec.stderr) {
    // console.log('STDERR: ' + exec.stderr)
    return {
      error: exec.stderr,
    }
  }
  return exec.stdout
}
