import { log } from '@graphprotocol/graph-ts'

import {
  BatchPrepared as BatchPreparedEvent,
  CreateSRRWithProof as CreateSRRWithProofEvent,
} from '../generated/BulkIssue/BulkIssue'
import { BulkIssue } from '../generated/schema'
import { eventUTCMillis } from './utils'

export function handleBatchPrepared(event: BatchPreparedEvent): void {
  let merkleRoot = event.params.merkleRoot.toHexString()
  let sender = event.params.sender.toHexString()
  let batch = BulkIssue.load(merkleRoot)
  if (batch != null) {
    log.info('already received this event for merkleRoot: {}', [event.params.merkleRoot.toString()])
    return
  }

  batch = new BulkIssue(merkleRoot)
  batch.srrs = []
  batch.merkleRoot = event.params.merkleRoot
  batch.sender = event.params.sender
  batch.createdAt = batch.updatedAt = eventUTCMillis(event)
  batch.save()
}

export function handleCreateSRRWithProof(event: CreateSRRWithProofEvent): void {
  let merkleRoot = event.params.merkleRoot.toHexString()
  let srrId = event.params.tokenId.toString()
  log.info('handleCreateSRRWithProof: merkleRoot {}', [merkleRoot])
  let batch = BulkIssue.load(merkleRoot)
  if (batch == null) {
    log.error('received a CreateSRRWithProof event for an unknown batch. MerkleRoot: {}', 
      [event.params.merkleRoot.toString()]
    )
    return
  }

  log.info('adding srrHash {}', [event.params.srrHash.toHex()])
  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  let srrs = batch.srrs
  srrs.push(event.params.srrHash)  
  batch.srrs = srrs
  batch.tokenId = srrId
  batch.updatedAt = eventUTCMillis(event)
  batch.save()
}