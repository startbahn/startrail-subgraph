import { log } from '@graphprotocol/graph-ts'

import {
  BatchPrepared as BatchPreparedEvent,
  CreateSRRWithProof as CreateSRRWithProofEvent,
} from '../generated/BulkIssue/BulkIssue'
import { BulkIssue } from '../generated/schema'
import { eventUTCMillis } from './utils'

export function handleBatchPrepared(event: BatchPreparedEvent): void {
  let merkleRoot = event.params.merkleRoot.toHexString()
  let batch = BulkIssue.load(merkleRoot)
  if (batch != null) {
    log.info('already received this event for merkleRoot: {}', [event.params.merkleRoot.toString()])
    return
  }

  batch = new BulkIssue(merkleRoot)
  batch.merkleRoot = event.params.merkleRoot
  batch.createdAt = batch.updatedAt = eventUTCMillis(event)
  batch.save()
}

export function handleCreateSRRWithProof(event: CreateSRRWithProofEvent): void {
  let merkleRoot = event.params.merkleRoot.toHexString()
  let batch = BulkIssue.load(merkleRoot)
  if (batch == null) {
    log.error('received a CreateSRRWithProof event for an unknown batch. MerkleRoot: {}', 
      [event.params.merkleRoot.toString()]
    )
    return
  }

  batch.srrs.push(event.params.srrHash)  
  batch.updatedAt = eventUTCMillis(event)
  
  batch.save()
}