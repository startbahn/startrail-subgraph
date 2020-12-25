/**
 * Generates a subgraph.yaml file specificly for a network deployment.
 * 
 * Uses deployments.json for contract addresses etc.
 */
const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

if (process.argv.length < 3) {
  console.log(`Usage: ${process.argv[1]} <mainnet|rinkeby|develop>`)
  process.exit(1)
}

const rootDir = path.dirname(path.dirname(require.main.filename))
const rootPath = (rootFile) => path.join(rootDir, rootFile)

const network = process.argv[2]
const deployments = JSON.parse(fs.readFileSync(rootPath('deployments.json')).toString())
const template = yaml.safeLoad(fs.readFileSync(rootPath('subgraph.template.yaml'), 'utf8'))

template.dataSources.forEach(ds => {
  ds.network = network === 'mainnet' ? 'mainnet' : 'rinkeby'

  const deployment = deployments[network][ds.name]
  if (!deployment?.address || !deployment?.startBlock) {
    console.error(`ERROR: address/startBlock not set for deployment '${ds.name}' network '${network}'\n`)
    process.exit(-1)
  }

  ds.source.address = deployment.address
  ds.source.startBlock = deployment.startBlock
})

fs.writeFileSync(rootPath(`subgraph.${network}.yaml`), yaml.safeDump(template))

