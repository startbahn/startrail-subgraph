import { log } from '@graphprotocol/graph-ts'

import {
  ApproveSRRByCommitmentWithProof as ApproveSRRByCommitmentWithProofEvent,
  BatchPrepared as BatchPreparedEvent,
} from '../generated/BulkTransfer/BulkTransfer'
import { BulkTransfer } from '../generated/schema'
import { eventUTCMillis, logInvocation } from './utils'

export function handleBatchPrepared(event: BatchPreparedEvent): void {
  logInvocation('handleBatchPrepared', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  let batch = BulkTransfer.load(merkleRoot)
  if (batch != null) {
    log.info('already received this event for merkleRoot: {}', [
      event.params.merkleRoot.toString(),
    ])
    return
  }

  batch = new BulkTransfer(merkleRoot)
  batch.srrApproveHashes = []
  batch.merkleRoot = event.params.merkleRoot
  batch.sender = event.params.sender

  batch.createdAt = batch.updatedAt = eventUTCMillis(event)
  batch.save()
}

export function handleApproveSRRByCommitmentWithProof(
  event: ApproveSRRByCommitmentWithProofEvent
): void {
  logInvocation('handleApproveSRRByCommitmentWithProof', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  const batch = BulkTransfer.load(merkleRoot)
  if (batch == null) {
    log.error(
      'received a ApproveSRRByCommitmentWithProofEvent event for an unknown batch transfer. MerkleRoot: {}',
      [event.params.merkleRoot.toString()]
    )
    return
  }

  log.info('adding srrApproveHash {}', [event.params.srrApproveHash.toHex()])
  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  const txs = batch.srrApproveHashes
  txs.push(event.params.srrApproveHash)
  batch.srrApproveHashes = txs
  batch.tokenId = event.params.tokenId.toString()
  batch.updatedAt = eventUTCMillis(event)
  batch.save()
}
