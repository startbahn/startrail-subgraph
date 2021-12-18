import type { Request, Response } from 'express'

import * as handler from '../handler'

describe('env', () => {
  it('should have CHECKER_RUNTIME_SUBGRAPH_URL', () => {
    expect(process.env.CHECKER_RUNTIME_SUBGRAPH_URL).toBeDefined()
  })

  it('should have CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL', () => {
    expect(process.env.CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL).toBeDefined()
  })

  it('should have CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING', () => {
    expect(process.env.CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING).toBeDefined()
  })

  it('should haveCHECKER_DEPLOY_MEMORY_SIZE', () => {
    expect(process.env.CHECKER_DEPLOY_MEMORY_SIZE).toBeDefined()
  })

  it('should have CHECKER_DEPLOY_TIMEOUT', () => {
    expect(process.env.CHECKER_DEPLOY_TIMEOUT).toBeDefined()
  })
})

describe('handler', () => {
  it('succeeds with getConfig', () => {
    const config = handler.getConfig()
    expect(config.CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING).toBeDefined()
    expect(config.CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL).toBeDefined()
    expect(config.CHECKER_RUNTIME_SUBGRAPH_URL).toBeDefined()
  })

  it('succeeds with fetchSubgraphStatus', async () => {
    const result = await handler.fetchSubgraphStatus()
    expect(result.data._meta.block).toBeDefined()
    expect(result.data._meta.block).toBeDefined()
  })

  it('succeeds with fetchCurrentBlock', async () => {
    const result = await handler.fetchCurrentBlock()
    expect(result.id).toBeDefined()
    expect(result.result).toBeDefined()
    expect(result.jsonrpc).toBeDefined()
  })

  it('succeeds with checkSubgraph', async () => {
    const mockReq = {} as Request
    const mockRes = {
      status: jest.fn(),
      send: jest.fn((msg) => msg),
    }
    mockRes.status.mockReturnValue(mockRes)

    const result = await handler.checkSubgraph(
      mockReq,
      (mockRes as unknown) as Response
    )
    expect(result).toBe('OK')
  })

  it('failed with checkSubgraph - hasIndexingErrors', async () => {
    const mockReq = {} as Request
    const mockRes = {
      status: jest.fn(),
      send: jest.fn((obj) => obj),
    }
    mockRes.status.mockReturnValue(mockRes)

    const spy = jest.spyOn(handler, 'fetchSubgraphStatus')

    spy.mockResolvedValue({
      data: {
        _meta: {
          hasIndexingErrors: true,
          block: {
            number: 1,
          },
        },
      },
    })

    const result = await handler.checkSubgraph(
      mockReq,
      (mockRes as unknown) as Response
    )

    expect(result).toEqual({
      msg: 'hasIndexingErrors',
      error: true,
    })

    spy.mockRestore()
  })

  it('failed with checkSubgraph - Subgraph indexing is lagging or stalled', async () => {
    const mockReq = {} as Request
    const mockRes = {
      status: jest.fn(),
      send: jest.fn((obj) => obj),
    }
    mockRes.status.mockReturnValue(mockRes)

    const getConfigSpy = jest.spyOn(handler, 'getConfig')
    getConfigSpy.mockReturnValue({
      CHECKER_RUNTIME_SUBGRAPH_URL:
        process.env.CHECKER_RUNTIME_SUBGRAPH_URL || '',
      CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL:
        process.env.CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL || '',
      CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING: '200',
    })

    const fetchSubgraphStatusSpy = jest.spyOn(handler, 'fetchSubgraphStatus')
    fetchSubgraphStatusSpy.mockResolvedValue({
      data: {
        _meta: {
          hasIndexingErrors: false,
          block: {
            number: 1,
          },
        },
      },
    })

    const fetchCurrentBlockSpy = jest.spyOn(handler, 'fetchCurrentBlock')
    fetchCurrentBlockSpy.mockResolvedValue({
      id: 1,
      jsonrpc: '2.0',
      result: '300',
    })

    const result = await handler.checkSubgraph(
      mockReq,
      (mockRes as unknown) as Response
    )

    expect(result).toEqual({
      msg: 'Subgraph indexing is lagging or stalled',
      error: true,
    })

    getConfigSpy.mockRestore()
    fetchSubgraphStatusSpy.mockRestore()
    fetchCurrentBlockSpy.mockRestore()
  })
})
