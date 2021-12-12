export type CloudFunctionType = {
  handler: string
  timeout: string
  memorySize: number
  events: object[]
}

export type ServerlessConfigurationType = {
  service: string
  frameworkVersion: '2'
  useDotenv?: boolean
  custom: Record<string, any>
  plugins: string[]
  provider: {
    name: 'google'
    runtime: 'nodejs10' | 'nodejs12' | 'nodejs14' | 'nodejs16'
    stage: string
    region: string
    project: string
    credentials: string
  }
  functions: Record<string, CloudFunctionType>
}
