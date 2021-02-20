import {
  Address,
  BigInt,
  ByteArray,
  Bytes,
  crypto,
  ethereum,
  log,
} from '@graphprotocol/graph-ts'

import {
  CustomHistory,
  CustomHistoryType,
  LicensedUserWallet,
  SRR,
  SRRMetadataHistory,
  SRRProvenance,
  SRRTransferCommit,
} from '../generated/schema'
import {
  CreateCustomHistory as CustomHistoryCreatedEvent,
  CreateCustomHistoryType as CustomHistoryTypeCreatedEvent,
  CreateSRR as CreateSRREvent,
  Provenance as SRRProvenanceEvent,
  Provenance1 as SRRProvenanceWithCustomHistoryEvent,
  SRRCommitment as SRRCommitmentEvent,
  SRRCommitment1 as SRRCommitmentWithCustomHistoryEvent,
  SRRCommitmentCancelled as SRRCommitmentCancelledEvent,
  Transfer as TransferEvent,
  UpdateSRR as UpdateSRREvent,
  UpdateSRRMetadataDigest as UpdateSRRMetadataDigestEvent,
} from '../generated/StartrailRegistry/StartrailRegistry'
import { eventUTCMillis, ZERO_ADDRESS } from './utils'

export function handleTransfer(event: TransferEvent): void {
  let timestampMillis = eventUTCMillis(event);
  let srrId = event.params.tokenId.toString();

  log.info("Transfer for {}", [srrId]);
  log.info("from: {}", [event.params.from.toHexString()]);
  log.info("to: {}", [event.params.to.toHexString()]);

  let srr = SRR.load(srrId);
  if (srr == null) {
    srr = new SRR(srrId);
    srr.tokenId = srrId;
    srr.createdAt = timestampMillis;
    srr.txHash = event.transaction.hash;
  } else if (
    srr.transferCommitment != null &&
    event.params.from.toHexString() != ZERO_ADDRESS.toHexString()
  ) {
    // Transfer by commit/reveal
    log.info("clearing transferCommitment on token = {}", [srr.tokenId]);
    srr.transferCommitment = null;
  }

  srr.ownerAddress = event.params.to;
  srr.updatedAt = timestampMillis;
  srr.save();

  let srrCommit = SRRTransferCommit.load(srrId);
  if (srrCommit != null) {
    srrCommit.commitment = null;
    srrCommit.lastAction = "transfer";
    srrCommit.updatedAt = timestampMillis;
    srrCommit.save();
  }
}

export function handleCreateSRR(event: CreateSRREvent): void {
  let timestampMillis = eventUTCMillis(event);

  let srrId = event.params.tokenId.toString();
  let srr = SRR.load(srrId);

  // SRR should already exist for most tokens because handleTransfer will fire
  // first. However some tokens created under the old scheme
  // (RootLogic->StartrailRegistry) will be processed by CreateSRR only.
  // So we handle this here and create the SRR:
  if (srr == null) {
    srr = new SRR(srrId);
    srr.tokenId = srrId;
    srr.createdAt = timestampMillis;
    srr.txHash = event.transaction.hash;
  }

  srr.artistAddress = event.params.registryRecord.artistAddress;
  srr.isPrimaryIssuer = event.params.registryRecord.isPrimaryIssuer;
  srr.metadataDigest = event.params.metadataDigest;

  let issuerId = event.params.registryRecord.issuer.toHexString();
  let luw = LicensedUserWallet.load(issuerId);
  if (luw != null) {
    srr.issuer = luw.id;
  }

  srr.updatedAt = timestampMillis;

  srr.save();

  saveSRRMetadataHistory(srr as SRR, event);
}

export function handleSRRProvenance(event: SRRProvenanceEvent): void {
  let params = event.params;
  handleSRRProvenanceInternal(
    event,
    params.tokenId,
    params.from,
    params.to,
    params.timestamp,
    null,
    params.historyMetadataDigest,
    params.historyMetadataURI
  );
}

export function handleSRRProvenanceWithCustomHistory(
  event: SRRProvenanceWithCustomHistoryEvent
): void {
  let params = event.params;
  handleSRRProvenanceInternal(
    event,
    params.tokenId,
    params.from,
    params.to,
    params.timestamp,
    params.customHistoryId,
    params.historyMetadataDigest,
    params.historyMetadataURI
  );
}

/**
 * Can't use a union type to handle the 2 Provenance events with one function.
 *
 * So this function exists to handle both with a superset of the
 * available parameters.
 */
function handleSRRProvenanceInternal(
  event: ethereum.Event,
  tokenId: BigInt,
  from: Address,
  to: Address,
  timestamp: BigInt,
  customHistoryId: BigInt,
  historyMetadataDigest: string,
  historyMetadataURI: string
): void {
  let srrId = tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId]);
    return;
  }

  // Update existing SRR
  srr.ownerAddress = to;
  srr.updatedAt = eventUTCMillis(event);
  srr.save();

  // Create new Provenance
  let provenanceId = crypto
    .keccak256(ByteArray.fromUTF8(tokenId.toString() + timestamp.toString()))
    .toHexString();

  let provenance = new SRRProvenance(provenanceId);

  provenance.srr = srr.id;
  provenance.from = from;
  provenance.to = to;

  provenance.metadataDigest = Bytes.fromHexString(
    historyMetadataDigest
  ) as Bytes;
  provenance.metadataURI = historyMetadataURI;

  if (customHistoryId) {
    // CustomHistory.load(event.params.customHistoryId)
    provenance.customHistory = customHistoryId.toString();
  }

  provenance.timestamp = timestamp;
  provenance.createdAt = eventUTCMillis(event);

  provenance.save();
}

export function handleCustomHistoryType(
  event: CustomHistoryTypeCreatedEvent
): void {
  let id = event.params.id.toString();

  let cht = new CustomHistoryType(id);
  cht.name = event.params.historyType;
  cht.createdAt = eventUTCMillis(event);

  cht.save();
}

export function handleCustomHistory(event: CustomHistoryCreatedEvent): void {
  let id = event.params.id.toString();

  let ch = new CustomHistory(id);
  ch.name = event.params.name;
  ch.historyType = event.params.customHistoryTypeId.toString();
  ch.metadataDigest = event.params.metadataDigest;
  ch.createdAt = eventUTCMillis(event);

  ch.save();
}

export function handleSRRCommitment(event: SRRCommitmentEvent): void {
  let params = event.params;
  handleSRRCommitmentInternal(
    event,
    params.owner,
    params.commitment,
    params.tokenId,
    null
  );
}

export function handleSRRCommitmentWithCustomHistory(
  event: SRRCommitmentWithCustomHistoryEvent
): void {
  let params = event.params;
  handleSRRCommitmentInternal(
    event,
    params.owner,
    params.commitment,
    params.tokenId,
    params.customHistoryId
  );
}

function handleSRRCommitmentInternal(
  event: ethereum.Event,
  owner: Address,
  commitment: Bytes,
  tokenId: BigInt,
  customHistoryId: BigInt
): void {
  let srrId = tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId]);
    return;
  }

  log.info("SRRCommitment commitment = {}", [commitment.toHexString()]);

  let blockTime = eventUTCMillis(event);

  srr.transferCommitment = commitment;
  srr.updatedAt = blockTime;
  srr.save();

  let srrCommit = SRRTransferCommit.load(srrId);
  if (srrCommit == null) {
    srrCommit = new SRRTransferCommit(srrId);
    srrCommit.createdAt = blockTime;
  }

  srrCommit.commitment = srr.transferCommitment;
  srrCommit.lastAction = "approve";

  if (customHistoryId != null) {
    srrCommit.customHistory = customHistoryId.toString();
  }

  srrCommit.updatedAt = blockTime;
  srrCommit.save();
}

export function handleSRRCommitmentCancelled(
  event: SRRCommitmentCancelledEvent
): void {
  let srrId = event.params.tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId]);
    return;
  }

  let blockTime = eventUTCMillis(event);

  srr.transferCommitment = null;
  srr.updatedAt = blockTime;
  srr.save();

  let srrCommit = SRRTransferCommit.load(srrId);
  if (srrCommit == null) {
    log.error(
      `received event but don't have corresponding SRRTransferCommit: {}`,
      [srrId]
    );
    return;
  }

  srrCommit.lastAction = "cancel";
  srrCommit.commitment = null;
  srrCommit.updatedAt = blockTime;
  srrCommit.save();
}

export function handleUpdateSRR(event: UpdateSRREvent): void {
  let srrId = event.params.tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId]);
    return;
  }

  srr.artistAddress = event.params.registryRecord.artistAddress;
  srr.isPrimaryIssuer = event.params.registryRecord.isPrimaryIssuer;
  srr.updatedAt = eventUTCMillis(event);

  srr.save();
}

export function handleUpdateSRRMetadataDigest(
  event: UpdateSRRMetadataDigestEvent
): void {
  let srrId = event.params.tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId]);
    return;
  }

  srr.updatedAt = eventUTCMillis(event);
  srr.metadataDigest = event.params.metadataDigest;
  srr.save();

  saveSRRMetadataHistory(srr as SRR, event);
}

function saveSRRMetadataHistory(srr: SRR, event: ethereum.Event): void {
  let metadataHistoryId = crypto
    .keccak256(
      ByteArray.fromUTF8(
        event.transaction.hash.toHexString() +
          event.logIndex.toHexString() +
          srr.metadataDigest.toHexString()
      )
    )
    .toHexString();

  let srrMetadataHistory = new SRRMetadataHistory(metadataHistoryId); // metadataHistoryId)
  srrMetadataHistory.srr = srr.id;
  srrMetadataHistory.createdAt = eventUTCMillis(event);
  srrMetadataHistory.metadataDigest = Bytes.fromHexString(
    srr.metadataDigest.toHexString()
  ) as Bytes;
  srrMetadataHistory.save();
}
