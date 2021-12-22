import { log } from '@graphprotocol/graph-ts'

import {
  BatchPrepared as BatchPreparedEvent,
  CreateSRRWithProof as CreateSRRWithProofEvent,
  ApproveSRRByCommitmentWithProof as ApproveSRRByCommitmentWithProofEvent,
  TransferFromWithProvenanceWithProof as TransferFromWithProvenanceWithProofEvent,
} from '../generated/Bulk/Bulk'
import { Bulk, BulkSRR } from '../generated/schema'
import { eventUTCMillis, logInvocation, secondsToMillis } from './utils'

export function handleBatchPrepared(event: BatchPreparedEvent): void {
  logInvocation('handleBatchPrepared', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  let batch = Bulk.load(merkleRoot)
  if (batch != null) {
    log.info('already received this event for merkleRoot: {}', [
      event.params.merkleRoot.toString(),
    ])
    return
  }

  batch = new Bulk(merkleRoot)
  batch.merkleRoot = event.params.merkleRoot
  batch.sender = event.params.sender

  batch.createdAt = batch.updatedAt = eventUTCMillis(event)
  batch.save()
}

export function handleCreateSRRWithProof(event: CreateSRRWithProofEvent): void {
  logInvocation('handleCreateSRRWithProof', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  const batch = Bulk.load(merkleRoot)
  if (batch == null) {
    log.error(
      'received a CreateSRRWithProof event for an unknown batch. MerkleRoot: {}',
      [event.params.merkleRoot.toString()]
    )
    return
  }

  const tokenIdStr = event.params.tokenId.toString()
  const srrHash = event.params.leafHash

  log.info('adding BulkSRR for token {} and hash {}', [
    tokenIdStr,
    srrHash.toHex(),
  ])

  const timestampMillis = eventUTCMillis(event)

  const bulkIssueSRR = new BulkSRR(srrHash.toHex())
  bulkIssueSRR.bulk = merkleRoot
  bulkIssueSRR.hash = srrHash
  bulkIssueSRR.tokenId = tokenIdStr
  bulkIssueSRR.createdAt = timestampMillis
  bulkIssueSRR.save()

  batch.updatedAt = timestampMillis
  batch.save()
}

export function handleApproveSRRByCommitmentWithProof(
  event: ApproveSRRByCommitmentWithProofEvent
): void {
  logInvocation('handleApproveSRRByCommitmentWithProof', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  const batch = Bulk.load(merkleRoot)
  if (batch == null) {
    log.error(
      'received a ApproveSRRByCommitmentWithProofEvent event for an unknown batch. MerkleRoot: {}',
      [event.params.merkleRoot.toString()]
    )
    return
  }

  const tokenIdStr = event.params.tokenId.toString()
  const leafHash = event.params.leafHash

  log.info('adding BulkSRR for token {} and hash {}', [
    tokenIdStr,
    leafHash.toHex(),
  ])

  const timestampMillis = eventUTCMillis(event)

  const bulkSRR = new BulkSRR(leafHash.toHex())
  bulkSRR.bulk = merkleRoot
  bulkSRR.hash = leafHash
  bulkSRR.tokenId = tokenIdStr
  bulkSRR.createdAt = timestampMillis
  bulkSRR.save()

  batch.updatedAt = timestampMillis
  batch.save()
}

export function handleTransferFromWithProvenanceWithProof(
  event: TransferFromWithProvenanceWithProofEvent
): void {
  logInvocation('handleTransferFromWithProvenanceWithProof', event)

  const merkleRoot = event.params.merkleRoot.toHexString()
  const batch = Bulk.load(merkleRoot)
  if (batch == null) {
    log.error(
      'received a TransferFromWithProvenanceWithProofEvent event for an unknown batch. MerkleRoot: {}',
      [event.params.merkleRoot.toString()]
    )
    return
  }

  const tokenIdStr = event.params.tokenId.toString()
  const leafHash = event.params.leafHash

  log.info('adding BulkSRR for token {} and hash {}', [
    tokenIdStr,
    leafHash.toHex(),
  ])

  const timestampMillis = eventUTCMillis(event)

  const bulkSRR = new BulkSRR(leafHash.toHex())
  bulkSRR.bulk = merkleRoot
  bulkSRR.hash = leafHash
  bulkSRR.tokenId = tokenIdStr
  bulkSRR.createdAt = timestampMillis
  bulkSRR.save()

  batch.updatedAt = timestampMillis
  batch.save()
}
