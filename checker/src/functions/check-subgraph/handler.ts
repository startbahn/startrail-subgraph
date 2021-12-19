import type { Request, Response } from 'express'
import axios from 'axios'
import pRetry from 'p-retry'

const RETRY_TIME = 3

type ConfigType = {
  CHECKER_RUNTIME_SUBGRAPH_URL: string
  CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL: string
  CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING: string
}

type SubgraphStatusType = {
  data: {
    _meta: {
      block: {
        number: number
      }
      hasIndexingErrors: boolean
    }
  }
}

type CurrentBlockType = {
  jsonrpc: string
  id: number
  result: string
}

type CheckSubgraphSuccessResponse = string

type CheckSubgraphErrorResponseType = {
  msg: string
  error: boolean
}

// load from runtime environment variables
export const getConfig = (): ConfigType => {
  return {
    CHECKER_RUNTIME_SUBGRAPH_URL:
      process.env.CHECKER_RUNTIME_SUBGRAPH_URL || '',
    CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL:
      process.env.CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL || '',
    CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING:
      process.env.CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING || '',
  }
}

const SUBGRAPH_QUERY = `{"query":"{\\n  _meta {\\n    block {\\n      number\\n    }\\n    hasIndexingErrors\\n  }\\n}\\n","variables":null,"operationName":null}`

const ETHEREUM_GET_BLOCK_QUERY = `{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}`

export const fetchSubgraphStatus = async (): Promise<SubgraphStatusType> => {
  const url = getConfig().CHECKER_RUNTIME_SUBGRAPH_URL
  const body = SUBGRAPH_QUERY
  return pRetry(
    () =>
      axios
        .post(url, body, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then((response) => {
          return response.data as SubgraphStatusType
        }),
    {
      retries: RETRY_TIME,
      onFailedAttempt: (error) => {
        console.info(`failure [${error.message}] retry ...`)
      },
    }
  )
}

export const fetchCurrentBlock = async (): Promise<CurrentBlockType> => {
  const url = getConfig().CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL
  const body = ETHEREUM_GET_BLOCK_QUERY
  return pRetry(
    () =>
      axios
        .post(url, body, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then((response) => {
          return response.data as CurrentBlockType
        }),
    {
      retries: RETRY_TIME,
      onFailedAttempt: (error) => {
        console.info(`failure [${error.message}] retry ...`)
      },
    }
  )
}

export const checkSubgraph = async (
  req: Request,
  res: Response
): Promise<CheckSubgraphSuccessResponse | CheckSubgraphErrorResponseType> => {
  const succeedRespond = (
    responseBody: CheckSubgraphSuccessResponse
  ): CheckSubgraphSuccessResponse =>
    (res
      .status(200)
      .send(responseBody) as unknown) as CheckSubgraphSuccessResponse

  const errorResponse = (msg: string) => {
    console.error(`ERROR: ${msg}`)
    return (res
      .status(200)
      .send({ msg, error: true }) as unknown) as CheckSubgraphErrorResponseType
  }

  try {
    //
    // Fetch Subgraph Status
    //
    const subgraphStatus = await fetchSubgraphStatus().then(
      (result) => result.data._meta
    )
    console.log(`subgraphStatus: ${JSON.stringify(subgraphStatus)}`)

    //
    // Fail if hasIndexingErrors
    //
    if (subgraphStatus.hasIndexingErrors === true) {
      return errorResponse(`hasIndexingErrors`)
    }

    //
    // Compare current block with indexed block
    //
    const currentBlock = await fetchCurrentBlock().then((getBlockResult) =>
      Number(getBlockResult.result)
    )
    console.log(`currentBlock: ${currentBlock}`)

    const indexedBlockNumber = subgraphStatus.block.number
    console.log(`indexedBlockNumber: ${indexedBlockNumber}`)

    if (
      currentBlock - indexedBlockNumber >
      Number(getConfig().CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING)
    ) {
      return errorResponse('Subgraph indexing is lagging or stalled')
    }

    return succeedRespond('OK')
  } catch (err) {
    console.error(err)
    return errorResponse(err.toString())
  }
}
