/**
 * Generates a subgraph.yaml file specificly for a network deployment.
 *
 * Uses deployments.json for contract addresses etc.
 */
const fs = require('fs')
const yaml = require('js-yaml')
const path = require('path')

const rootDir = path.dirname(path.dirname(require.main.filename))
const rootPath = (rootFile) => path.join(rootDir, rootFile)
const startrailPackagePath = rootPath(
  path.join('node_modules', '@startbahn', 'startrail')
)

const isLegacyContract = (contractName) => ['LicensedUserEvent', 'RootLogic'].indexOf(contractName) !== -1

if (process.argv.length !== 3 && process.argv.length !== 6) {
  console.log(`
  Usage: node ${process.argv[1]} <deployment name> [ <deploy.json path> <abis folder path> <startBlock> ]
    
  Script can be run in one of 2 ways:

  1) Pass a single argument which is the name of a deployment under 
     'node_modules/@startbahn/startrail/deployments'.

     In the case all contract address information and ABIs are available under
     the startrail package and startBlock information in ./deployments.json so
     no extra arguments are required.

  2) Pass a logical name plus ALL information required to populate the subgraph
     yaml file.
`)
  process.exit(1)
}

const deploymentName = process.argv[2]
let network
if (deploymentName === 'mainnet') {
  network = 'mainnet'
} else if (deploymentName.startsWith('mumbai')) {
  network = 'mumbai'
} else if (deploymentName.startsWith('rinkeby')) {
  network = 'rinkeby'
} else {
  throw new Error(`network unknown for deployment [${deploymentName}]`)
}

//
// Collect and validate input arguments
//
const isStartrailPackageDeployment = process.argv.length === 3

let deploymentFilePath
if (isStartrailPackageDeployment) {
  deploymentFilePath = path.join(
    startrailPackagePath,
    'deployments',
    deploymentName,
    `deploy.json`
  )
} else {
  deploymentFilePath = process.argv[3]
}

const contractAddresses = JSON.parse(fs.readFileSync(deploymentFilePath))

let abisPath
if (isStartrailPackageDeployment) {
  abisPath = path.join(startrailPackagePath, 'abi')
} else {
  abisPath = process.argv[4]
}

if (!fs.existsSync(abisPath)) {
  console.error(`ERROR: abisPath not found at [${abisPath}]\n`)
  process.exit(2)
}

let startBlockArgument
if (!isStartrailPackageDeployment) {
  startBlockArgument = Number.parseInt(process.argv[5])
  if (!Number.isInteger(startBlockArgument)) {
    console.error(
      `ERROR: A startBlock MUST be given when specifiying a deployment path\n`
    )
    process.exit(3)
  }
}

const subgraphDeployments = JSON.parse(
  fs.readFileSync(rootPath('deployments.json')).toString()
)
const subgraphYamlTemplate = yaml.safeLoad(
  fs.readFileSync(rootPath('subgraph.template.yaml'), 'utf8')
)

subgraphYamlTemplate.dataSources.forEach((ds) => {
  //
  // Get contractAddress
  //
  const contractName = ds.name

  let contractAddress
  if (!isLegacyContract(contractName)) {
    // For non legact contracts the address MUST be in the deploy.json
    // contractAddresses lookup
    const addressKey = `${contractName[0].toLowerCase()}${contractName.substring(
      1
    )}ProxyAddress`
    contractAddress = contractAddresses[addressKey]
    if (!contractAddress) {
      console.error(
        `ERROR: contract address not set for contract '${contractName}'\n`
      )
      process.exit(4)
    }
  } else {
    // For legacy contracts see if the address is in the subgraph deployment
    // json. If it's not then assume it's not deployed (a local or new
    // contracts only deployment) and just set the zero address
    contractAddress = subgraphDeployments[deploymentName][contractName]?.address
    if (!contractAddress) {
      contractAddress = '0x0000000000000000000000000000000000000000'
    }
  }

  //
  // Get and set startBlock
  //
  let startBlock
  if (isStartrailPackageDeployment) {
    startBlock = subgraphDeployments[deploymentName][contractName]?.startBlock
    if (!startBlock) {
      console.error(
        `ERROR: startBlock not set for contract '${contractName}' in ./deployments.json`
      )
      process.exit(5)
    }
  } else {
    startBlock = startBlockArgument
  }

  //
  // Set ABI folder
  //
  const abisFolder = !isLegacyContract(contractName) ? abisPath : rootPath('abis-legacy')

  //
  // Set dataSource properties
  //
  ds.network = network
  ds.source.address = contractAddress
  ds.source.startBlock = startBlock
  ds.mapping.abis[0].file = path.join(abisFolder, `${contractName}.json`)
})

fs.writeFileSync(
  rootPath(`subgraph.${deploymentName}.yaml`),
  yaml.safeDump(subgraphYamlTemplate)
)
