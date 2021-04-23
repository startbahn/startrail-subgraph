import { log } from '@graphprotocol/graph-ts'

import {
  BatchPrepared as BatchPreparedEvent,
  ApproveSRRByCommitmentWithProof as ApproveSRRByCommitmentWithProofEvent,
  MigrateBatch as MigrateBatchEvent,
} from '../generated/BulkTransfer/BulkTransfer'
import { BulkTransfer } from '../generated/schema'
import { eventUTCMillis, logInvocation, secondsToMillis } from './utils'

export function handleBatchPrepared(event: BatchPreparedEvent): void {
  logInvocation("handleBatchPrepared", event);

  let merkleRoot = event.params.merkleRoot.toHexString();
  let batch = BulkTransfer.load(merkleRoot);
  if (batch != null) {
    log.info("already received this event for merkleRoot: {}", [
      event.params.merkleRoot.toString(),
    ]);
    return;
  }

  batch = new BulkTransfer(merkleRoot);
  batch.txs = [];
  batch.merkleRoot = event.params.merkleRoot;
  batch.sender = event.params.sender;

  batch.createdAt = batch.updatedAt = eventUTCMillis(event);
  batch.save();
}

export function handleCreateSRRWithProof(event: ApproveSRRByCommitmentWithProofEvent): void {
  logInvocation("handleCreateSRRWithProof", event);

  let merkleRoot = event.params.merkleRoot.toHexString();
  let batch = BulkTransfer.load(merkleRoot);
  if (batch == null) {
    log.error(
      "received a CreateSRRWithProof event for an unknown batch. MerkleRoot: {}",
      [event.params.merkleRoot.toString()]
    );
    return;
  }

  log.info("adding srrApproveHash {}", [event.params.srrApproveHash.toHex()]);
  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  let txs = batch.txs;
  txs.push(event.params.srrApproveHash);
  batch.txs = txs;
  batch.tokenId = event.params.tokenId.toString();
  batch.updatedAt = eventUTCMillis(event);
  batch.save();
}

export function handleMigrateBatch(event: MigrateBatchEvent): void {
  logInvocation("handleMigrateBatch", event);

  let merkleRoot = event.params.merkleRoot.toHexString();

  let batch = new BulkTransfer(merkleRoot);

  batch.merkleRoot = event.params.merkleRoot;
  batch.sender = event.params.sender;
  batch.txs = event.params.processedLeaves;

  batch.createdAt = secondsToMillis(event.params.originTimestampCreated);
  batch.updatedAt = secondsToMillis(event.params.originTimestampUpdated);

  batch.save();
}
