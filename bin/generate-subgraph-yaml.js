/**
 * Generates a subgraph.yaml file specificly for a network deployment.
 * 
 * Uses deployments.json for contract addresses etc.
 */
const fs   = require('fs');
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
  ds.source.address = deployments[network][ds.name].address
  ds.source.startBlock = deployments[network][ds.name].startBlock
})

fs.writeFileSync(rootPath(`subgraph.${network}.yaml`) , yaml.safeDump(template))

