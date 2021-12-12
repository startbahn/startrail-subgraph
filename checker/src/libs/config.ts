import convict from 'convict'
import { config as dotenvConfig } from 'dotenv'

const fields = {
  SLS_STAGE: {
    doc: 'serverless stage',
    format: String,
    env: 'SLS_STAGE',
    default: 'dev',
  },

  GCF_REGION: {
    doc: 'GCF_REGION',
    format: String,
    env: 'GCF_REGION',
    default: '',
  },

  GCF_PROJECT_NAME: {
    doc: 'GCF_PROJECT_NAME',
    format: String,
    env: 'GCF_PROJECT_NAME',
    default: '',
  },
  GCF_CREDENTAILS: {
    doc: 'GCF_CREDENTAILS',
    format: String,
    env: 'GCF_CREDENTAILS',
    default: '',
  },
  CHECKER_DEPLOY_MEMORY_SIZE: {
    doc: 'CHECKER_DEPLOY_MEMORY_SIZE',
    format: Number,
    env: 'CHECKER_DEPLOY_MEMORY_SIZE',
    default: '',
  },
  CHECKER_DEPLOY_TIMEOUT: {
    doc: 'CHECKER_DEPLOY_TIMEOUT',
    format: String,
    env: 'CHECKER_DEPLOY_TIMEOUT',
    default: '',
  },
  CHECKER_RUNTIME_SUBGRAPH_URL: {
    doc: 'CHECKER_RUNTIME_SUBGRAPH_URL',
    format: Number,
    env: 'CHECKER_RUNTIME_SUBGRAPH_URL',
    default: '',
  },
  CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL: {
    doc: 'CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL',
    format: String,
    env: 'CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL',
    default: '',
  },
  CHECKER_RUNTIME_THRESHOLD_BLOCKS_LAGGING: {
    doc: 'CHECKER_RUNTIME_THRESHOLD_BLOCKS_LAGGING',
    format: Number,
    env: 'CHECKER_RUNTIME_THRESHOLD_BLOCKS_LAGGING',
    default: '',
  },
}

let configObject: convict.Config<any>

export function initConfig(): void {
  if (configObject) {
    return
  }

  switch (process.env.NODE_ENV || 'development') {
    case 'development':
      dotenvConfig({ path: '.env.dev' })
      break
    case 'production':
      dotenvConfig({ path: '.env.prod' })
      break
    default:
      throw new Error(`Unknown environment ${process.env.NODE_ENV}`)
  }

  configObject = convict(fields)
  configObject.validate({ allowed: 'strict' })
}

export function config(field: string): string {
  if (!configObject) {
    throw new Error('You have to init config first')
  }
  return configObject.get(field) as string
}

initConfig()
