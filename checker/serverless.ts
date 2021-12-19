import { functions } from '@functions/config'
import { config } from '@libs/config'
import { ServerlessConfigurationType } from '@serverlesss-types/serverless'

const serverlessConfiguration: ServerlessConfigurationType = {
  service: 'subgraph',
  frameworkVersion: '2',
  useDotenv: true,
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true,
    },
    dotenv: {
      exclude: [
        'SLS_DEBUG',
        'SLS_STAGE',
        'GCF_NODE_VERSION',
        'GCF_REGION',
        'GCF_PROJECT_NAME',
        'GCF_CREDENTAILS',
        'CHECKER_DEPLOY_MEMORY_SIZE',
        'CHECKER_DEPLOY_TIMEOUT',
      ],
    },
  },
  plugins: [
    'serverless-google-cloudfunctions',
    'serverless-webpack',
    'serverless-dotenv-plugin',
  ],
  provider: {
    name: 'google',
    runtime: config('GCF_NODE_VERSION'),
    stage: config('SLS_STAGE'),
    region: config('GCF_REGION'),
    project: config('GCF_PROJECT_NAME'),
    credentials: config('GCF_CREDENTAILS'),
  },
  functions,
}

module.exports = serverlessConfiguration
