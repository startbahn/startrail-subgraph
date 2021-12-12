import { config } from '@libs/config'
import { CloudFunctionType } from '@serverlesss-types/serverless'

export const checkSubgraph: CloudFunctionType = {
  handler: 'checkSubgraph',
  timeout: config('CHECKER_DEPLOY_TIMEOUT'),
  memorySize: Number(config('CHECKER_DEPLOY_MEMORY_SIZE')),
  events: [
    {
      http: 'path',
    },
  ],
}
