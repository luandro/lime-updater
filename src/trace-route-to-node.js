module.exports = async (node, ssh) => {
  let route = {
    node,
    distance: -1,
  }
  try {
    await ssh.exec('batctl', ['tr', node], {
      async onStdout(chunk) {
        const data = chunk.toString('utf8')
        if (data.includes('_dummy0')) {
          try {
            await data.split('\n').forEach(async output => {
              if (output.length > 1) {
                const info = await output.split(' ')
                const distance = await parseInt(info[1].split(':')[0], 2)
                if (!route.distance || distance > route.distance) {
                  route.distance = distance
                }
              }
            })
          } catch (error) {
            console.log("TCL: onStdout -~~~~~~> err", error)
          }
        }
      },
      onStderr(chunk) {
        console.log('stderrChunk ================> ', chunk.toString('utf8'))
      },
    })
    return route
  } catch (error) {
    console.log("TCL: err", error)
    return route
  }
}
