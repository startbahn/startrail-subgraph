import { log } from '@graphprotocol/graph-ts'

import {
  BatchPrepared as BatchPreparedEvent,
  CreateSRRWithProof as CreateSRRWithProofEvent,
  MigrateBatch as MigrateBatchEvent,
} from '../generated/BulkIssue/BulkIssue'
import { BulkIssue, BulkIssueSRR } from '../generated/schema'
import { eventUTCMillis, logInvocation, secondsToMillis } from './utils'

export function handleBatchPrepared(event: BatchPreparedEvent): void {
  logInvocation('handleBatchPrepared', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  let batch = BulkIssue.load(merkleRoot)
  if (batch != null) {
    log.info('already received this event for merkleRoot: {}', [
      event.params.merkleRoot.toString(),
    ])
    return
  }

  batch = new BulkIssue(merkleRoot)
  batch.merkleRoot = event.params.merkleRoot
  batch.issuer = event.params.sender

  batch.createdAt = batch.updatedAt = eventUTCMillis(event)
  batch.save()
}

export function handleCreateSRRWithProof(event: CreateSRRWithProofEvent): void {
  logInvocation('handleCreateSRRWithProof', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  const batch = BulkIssue.load(merkleRoot)
  if (batch == null) {
    log.error(
      'received a CreateSRRWithProof event for an unknown batch. MerkleRoot: {}',
      [event.params.merkleRoot.toString()]
    )
    return
  }

  const tokenIdStr = event.params.tokenId.toString()
  const srrHash = event.params.srrHash

  log.info('adding BulkIssueSRR for token {} and hash {}', [
    tokenIdStr,
    srrHash.toHex(),
  ])

  const timestampMillis = eventUTCMillis(event)

  const bulkIssueSRR = new BulkIssueSRR(srrHash.toHex())
  bulkIssueSRR.bulkIssue = merkleRoot
  bulkIssueSRR.hash = srrHash
  bulkIssueSRR.tokenId = tokenIdStr
  bulkIssueSRR.createdAt = timestampMillis
  bulkIssueSRR.save()

  batch.updatedAt = timestampMillis
  batch.save()
}

export function handleMigrateBatch(event: MigrateBatchEvent): void {
  logInvocation('handleMigrateBatch', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  const timestampUpdated = secondsToMillis(event.params.originTimestampUpdated)

  const batch = new BulkIssue(merkleRoot)
  batch.merkleRoot = event.params.merkleRoot
  batch.issuer = event.params.issuer
  batch.createdAt = secondsToMillis(event.params.originTimestampCreated)
  batch.updatedAt = timestampUpdated
  batch.save()

  const leaves = event.params.processedLeaves
  for (let leafIdx = 0; leafIdx < leaves.length; leafIdx++) {
    let leafHash = leaves[leafIdx]
    let bulkIssueSRR = new BulkIssueSRR(leafHash.toHex())
    bulkIssueSRR.bulkIssue = merkleRoot
    bulkIssueSRR.hash = leafHash
    // We don't have the exact original date for this so use updated timestamp
    // from the batch event as a closest approximation
    bulkIssueSRR.createdAt = timestampUpdated
    bulkIssueSRR.save()
  }
}
