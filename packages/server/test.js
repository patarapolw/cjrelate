const { spawn } = require('child_process')

async function main () {
  const p = spawn('mecab')

  p.stdout.on('data', (data) => {
    const s = data.toString().split('\n').map(row => row.split('\t')[0])
    console.log(s)
  })

  p.stdin.write('日本語です')
  p.stdin.write('\n')
  await new Promise(resolve => p.stdout.once('data', resolve))
  p.stdin.write('すもももももももものうち')
  p.stdin.end()
}

main().catch(console.error)
