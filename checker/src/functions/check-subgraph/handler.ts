import type { Request, Response } from 'express'
import axios from 'axios'
import pRetry from 'p-retry'

type ConfigType = {
  CHECKER_RUNTIME_SUBGRAPH_URL: string
  CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL: string
  CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING: string
}

// load from runtime environment variables
const getConfig = (): ConfigType => {
  return {
    CHECKER_RUNTIME_SUBGRAPH_URL: process.env.CHECKER_RUNTIME_SUBGRAPH_URL!,
    CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL: process.env
      .CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL!,
    CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING: process.env
      .CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING!,
  }
}

const SUBGRAPH_QUERY = `{"query":"{\\n  _meta {\\n    block {\\n      number\\n    }\\n    hasIndexingErrors\\n  }\\n}\\n","variables":null,"operationName":null}`

const ETHEREUM_GET_BLOCK_QUERY = `{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}`

const fetchJSONWithRetry = async (url: string, body: string): Promise<any> =>
  pRetry(
    () =>
      axios
        .post(url, body, {
          headers: { 'Content-Type': 'application/json' },
        })
        .then((response) => response.data),
    {
      retries: 3,
      onFailedAttempt: (error) => {
        console.info(`failure [${error.message}] retry ...`)
      },
    }
  )

export const checkSubgraph = async (
  req: Request,
  res: Response
): Promise<any> => {
  const respond = (responseBody: any) => res.status(200).send(responseBody)

  const errorResponse = (msg: string) => {
    console.error(`ERROR: ${msg}`)
    return respond({ msg, error: true })
  }

  try {
    //
    // Fetch Subgraph Status
    //
    const subgraphStatus = await fetchJSONWithRetry(
      getConfig().CHECKER_RUNTIME_SUBGRAPH_URL,
      SUBGRAPH_QUERY
    ).then((result) => result.data['_meta'])
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
    const currentBlock = await fetchJSONWithRetry(
      getConfig().CHECKER_RUNTIME_ETHEREUM_PROVIDER_URL,
      ETHEREUM_GET_BLOCK_QUERY
    ).then((getBlockResult) => Number(getBlockResult.result))
    console.log(`currentBlock: ${currentBlock}`)

    const indexedBlockNumber = subgraphStatus.block.number
    console.log(`indexedBlockNumber: ${indexedBlockNumber}`)

    if (
      currentBlock - indexedBlockNumber >
      Number(getConfig().CHECKER_RUNTIMETHRESHOLD_BLOCKS_LAGGING)
    ) {
      return errorResponse(`Subgraph indexing is lagging or stalled`)
    }

    return respond('OK')
  } catch (err: any) {
    console.error(err)
    return errorResponse(err.toString())
  }
}
