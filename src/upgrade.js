const putFile = require('./put-file')
const waitFor = require('./wait-for')

module.exports = async node => {
  console.log('Put file')
  console.log('Exec sysupgrade')
  await waitFor(3)
  return true
}
