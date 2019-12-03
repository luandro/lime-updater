const scp = require('scp')

module.exports = async (host, localFile, remoteFile) => new Promise((resolve, reject) => {
  console.log("TCL: host", host)
  const options = {
    file: localFile,
    user: 'root',
    host: host,
    port: '22',
    path: remoteFile,
  }
  scp.send(options, function (err) {
    if (err) reject(err)
    else resolve(true)
  })
})
