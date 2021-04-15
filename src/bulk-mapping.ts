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
  MigrateBatch as MigrateBatchEvent,
} from '../generated/BulkIssue/BulkIssue'
import {
  BatchPrepared as BatchPreparedEventLegacy,
  CreateSRRWithProof as CreateSRRWithProofEventLegacy,
} from '../generated/BulkIssue_legacy/BulkIssue'
import { BulkIssue } from '../generated/schema'
import { eventUTCMillis, logInvocation, secondsToMillis } from './utils'


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
  logInvocation("handleBatchPrepared", event);

  let merkleRoot = event.params.merkleRoot.toHexString();
  let batch = BulkIssue.load(merkleRoot);
  if (batch != null) {
    log.info("already received this event for merkleRoot: {}", [
      event.params.merkleRoot.toString(),
    ]);
    return;
  }

  batch = new BulkIssue(merkleRoot);
  batch.srrs = [];
  batch.merkleRoot = event.params.merkleRoot;
  batch.issuer = event.params.sender;

  batch.createdAt = batch.updatedAt = eventUTCMillis(event);
  batch.save();
}

export function handleCreateSRRWithProof(event: CreateSRRWithProofEvent): void {
  logInvocation("handleCreateSRRWithProof", event);

  let merkleRoot = event.params.merkleRoot.toHexString();
  let batch = BulkIssue.load(merkleRoot);
  if (batch == null) {
    log.error(
      "received a CreateSRRWithProof event for an unknown batch. MerkleRoot: {}",
      [event.params.merkleRoot.toString()]
    );
    return;
  }

  log.info("adding srrHash {}", [event.params.srrHash.toHex()]);
  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  let srrs = batch.srrs;
  srrs.push(event.params.srrHash);
  batch.srrs = srrs;
  batch.tokenId = event.params.tokenId.toString();
  batch.updatedAt = eventUTCMillis(event);
  batch.save();
}

export function handleMigrateBatch(event: MigrateBatchEvent): void {
  logInvocation("handleMigrateBatch", event);

  let merkleRoot = event.params.merkleRoot.toHexString();

  let batch = new BulkIssue(merkleRoot);

  batch.merkleRoot = event.params.merkleRoot;
  batch.issuer = event.params.issuer;
  batch.srrs = event.params.processedLeaves;

  batch.createdAt = secondsToMillis(event.params.originTimestampCreated);
  batch.updatedAt = secondsToMillis(event.params.originTimestampUpdated);

  batch.save();
}
