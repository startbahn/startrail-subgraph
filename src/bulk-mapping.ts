import { 
  log,
  ethereum, 
  Bytes,
  Address,
  BigInt,
} from '@graphprotocol/graph-ts'

import {
  BatchPrepared as BatchPreparedEvent,
  CreateSRRWithProof as CreateSRRWithProofEvent,
} from '../generated/BulkIssue/BulkIssue'
import {
  BatchPrepared as BatchPreparedEventLegacy,
  CreateSRRWithProof as CreateSRRWithProofEventLegacy,
} from '../generated/BulkIssue_legacy/BulkIssue'
import { BulkIssue } from '../generated/schema'
import { eventUTCMillis } from './utils'


export function handleBatchPreparedLegacy(event: BatchPreparedEventLegacy): void {
  let params = event.params
  handleBatchPreparedInternal(
    event,
    params.merkleRoot,
    null,
    )
}
export function handleCreateSRRWithProofLegacy(event: CreateSRRWithProofEventLegacy): void {
  let params = event.params
  handleCreateSRRWithProofInternal(
    event,
    params.merkleRoot,
    null,
    params.srrHash
  )
}
export function handleBatchPrepared(event: BatchPreparedEvent): void {
  let params = event.params
  handleBatchPreparedInternal(
    event,
    params.merkleRoot,
    params.sender
    )
}
export function handleCreateSRRWithProof(event: CreateSRRWithProofEvent): void {
  let params = event.params
  handleCreateSRRWithProofInternal(
    event,
    params.merkleRoot,
    params.tokenId,
    params.srrHash
  )
}

export function handleBatchPreparedInternal(
  event: ethereum.Event,
  merkleRoot: Bytes,
  sender: Address
): void {
  let merkleRootString = merkleRoot.toHexString()
  let batch = BulkIssue.load(merkleRootString)
  if (batch != null) {
    log.info('already received this event for merkleRoot: {}', [merkleRootString])
    return
  }

  batch = new BulkIssue(merkleRootString)
  batch.srrs = []
  batch.merkleRoot = merkleRoot
  batch.issuer = sender
  batch.createdAt = batch.updatedAt = eventUTCMillis(event)
  batch.save()
}

export function handleCreateSRRWithProofInternal(
  event: ethereum.Event,
  merkleRoot: Bytes,
  tokenId: BigInt,
  srrHash: Bytes
): void {
  let merkleRootString = merkleRoot.toHexString()
  log.info('handleCreateSRRWithProof: merkleRoot {}', [merkleRootString])
  let batch = BulkIssue.load(merkleRootString)
  if (batch == null) {
    log.error('received a CreateSRRWithProof event for an unknown batch. MerkleRoot: {}', 
      [merkleRootString]
    )
    return
  }

  log.info('adding srrHash {}', [srrHash.toHex()])
  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  let srrs = batch.srrs
  srrs.push(srrHash)  
  batch.srrs = srrs
  batch.tokenId = tokenId.toString()
  batch.updatedAt = eventUTCMillis(event)
  batch.save()
}