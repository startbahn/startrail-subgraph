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
  CreateCustomHistoryFromMigration as CustomHistoryCreatedFromMigrationEvent,
  CreateCustomHistoryType as CustomHistoryTypeCreatedEvent,
  CreateSRR as CreateSRREvent,
  CreateSRRFromMigration as CreateSRRFromMigrationEvent,
  MigrateSRR as MigrateSRREvent,
  Provenance as SRRProvenanceEvent,
  Provenance1 as SRRProvenanceWithCustomHistoryEvent,
  ProvenanceFromMigration as SRRProvenanceFromMigrationEvent,
  ProvenanceFromMigration1 as SRRProvenanceWithCustomHistoryFromMigrationEvent,
  SRRCommitment as SRRCommitmentEvent,
  SRRCommitment1 as SRRCommitmentWithCustomHistoryEvent,
  SRRCommitmentCancelled as SRRCommitmentCancelledEvent,
  SRRCommitmentCancelledFromMigration as SRRCommitmentCancelledFromMigrationEvent,
  SRRCommitmentFromMigration as SRRCommitmentFromMigrationEvent,
  SRRCommitmentFromMigration1 as SRRCommitmentWithCustomHistoryFromMigrationEvent,
  Transfer as TransferEvent,
  TransferFromMigration as TransferFromMigrationEvent,
  UpdateSRR as UpdateSRREvent,
  UpdateSRRFromMigration as UpdateSRRFromMigrationEvent,
  UpdateSRRMetadataDigest as UpdateSRRMetadataDigestEvent,
  UpdateSRRMetadataDigestFromMigration as UpdateSRRMetadataDigestFromMigrationEvent,
} from '../generated/StartrailRegistry/StartrailRegistry'
import { eventUTCMillis, logInvocation, ZERO_ADDRESS } from './utils'

export function handleMigrateSRR(event: MigrateSRREvent): void {
  logInvocation("handleMigrateSRR", event);
}

export function handleCreateCustomHistoryFromMigration(
  event: CustomHistoryCreatedFromMigrationEvent
): void {
  logInvocation("handleCreateCustomHistoryFromMigration", event);
}
export function handleSRRProvenanceFromMigration(
  event: SRRProvenanceFromMigrationEvent
): void {
  logInvocation("handleSRRProvenanceFromMigration", event);
}
export function handleSRRProvenanceWithCustomHistoryFromMigration(
  event: SRRProvenanceWithCustomHistoryFromMigrationEvent
): void {
  logInvocation("handleSRRProvenanceWithCustomHistoryFromMigration", event);
}
export function handleSRRCommitmentFromMigration(
  event: SRRCommitmentFromMigrationEvent
): void {
  logInvocation("handleSRRCommitmentFromMigration", event);
}
export function handleSRRCommitmentWithCustomHistoryFromMigration(
  event: SRRCommitmentWithCustomHistoryFromMigrationEvent
): void {
  logInvocation("handleSRRCommitmentWithCustomHistoryFromMigration", event);
}
export function handleSRRCommitmentCancelledFromMigration(
  event: SRRCommitmentCancelledFromMigrationEvent
): void {
  logInvocation("handleSRRCommitmentCancelledFromMigration", event);
}
export function handleUpdateSRRFromMigration(
  event: UpdateSRRFromMigrationEvent
): void {
  logInvocation("handleUpdateSRRFromMigration", event);
}
export function handleUpdateSRRMetadataDigestFromMigration(
  event: UpdateSRRMetadataDigestFromMigrationEvent
): void {
  logInvocation("handleUpdateSRRMetadataDigestFromMigration", event);
}

export function handleTransfer(event: TransferEvent): void {
  logInvocation("handleTransfer", event);
  handleTransferInternal(
    event,
    event.params.tokenId,
    event.params.from,
    event.params.to
  );
}

export function handleTransferFromMigration(
  event: TransferFromMigrationEvent
): void {
  logInvocation("handleTransferFromMigration", event);
  handleTransferInternal(
    event,
    event.params.tokenId,
    event.params.from,
    event.params.to
  );
}

function handleTransferInternal(
  event: ethereum.Event,
  tokenId: BigInt,
  from: Address,
  to: Address
): void {
  let timestampMillis = eventUTCMillis(event);
  let srrId = tokenId.toString();

  log.info("Transfer for {}", [srrId]);
  log.info("from: {}", [from.toHexString()]);
  log.info("to: {}", [to.toHexString()]);

  let srr = SRR.load(srrId)
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = srrId
    srr.createdAt = timestampMillis
    srr.txHash = event.transaction.hash
  } else if (
    srr.transferCommitment != null &&
    from.toHexString() != ZERO_ADDRESS.toHexString()
  ) {
    // Transfer by commit/reveal
    log.info("clearing transferCommitment on token = {}", [srr.tokenId])
    srr.transferCommitment = null
  }

  srr.ownerAddress = to;
  srr.updatedAt = timestampMillis;
  srr.save();

  let srrCommit = SRRTransferCommit.load(srrId)
  if (srrCommit != null) {
    srrCommit.commitment = null
    srrCommit.lastAction = "transfer"
    srrCommit.updatedAt = timestampMillis
    srrCommit.save()
  }
}

export function handleCreateSRRFromMigration(
  event: CreateSRRFromMigrationEvent
): void {
  logInvocation("handleCreateSRRFromMigration", event);
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

export function handleCreateSRR(event: CreateSRREvent): void {
  logInvocation("handleCreateSRR", event);

  let timestampMillis = eventUTCMillis(event);

  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)

  // SRR should already exist for most tokens because handleTransfer will fire
  // first. However some tokens created under the old scheme
  // (RootLogic->StartrailRegistry) will be processed by CreateSRR only.
  // So we handle this here and create the SRR:
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = srrId
    srr.createdAt = timestampMillis
    srr.txHash = event.transaction.hash
  }

  srr.artistAddress = event.params.registryRecord.artistAddress
  srr.isPrimaryIssuer = event.params.registryRecord.isPrimaryIssuer
  srr.metadataDigest = event.params.metadataDigest

  let issuerId = event.params.registryRecord.issuer.toHexString()
  let luw = LicensedUserWallet.load(issuerId)
  if (luw != null) {
    srr.issuer = luw.id
  }

  srr.updatedAt = timestampMillis


  srr.save()

  saveSRRMetadataHistory(srr as SRR, event)
}

export function handleSRRProvenance(event: SRRProvenanceEvent): void {
  logInvocation("handleSRRProvenance", event);
  let params = event.params;
  handleSRRProvenanceInternal(
    event,
    params.tokenId,
    params.from,
    params.to,
    null,
    params.historyMetadataDigest,
    params.historyMetadataURI
  )
}

export function handleSRRProvenanceWithCustomHistory(
  event: SRRProvenanceWithCustomHistoryEvent
): void {
  logInvocation("handleSRRProvenanceWithCustomHistory", event);
  let params = event.params;
  handleSRRProvenanceInternal(
    event,
    params.tokenId,
    params.from,
    params.to,
    params.customHistoryId,
    params.historyMetadataDigest,
    params.historyMetadataURI
  )
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
  customHistoryId: BigInt,
  historyMetadataDigest: string,
  historyMetadataURI: string
): void {
  let srrId = tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId])
    return
  }

  let timestampMillis = eventUTCMillis(event)

  // Update existing SRR
  srr.ownerAddress = to
  srr.updatedAt = timestampMillis
  srr.save()

  // Create new Provenance
  let provenanceId = crypto.keccak256(
    ByteArray.fromUTF8(
      tokenId.toString() +
      timestampMillis.toString()
    )
  ).toHexString()
  
  let provenance = new SRRProvenance(provenanceId)

  provenance.srr = srr.id
  provenance.from = from
  provenance.to = to

  provenance.metadataDigest = Bytes.fromHexString(
    historyMetadataDigest
  ) as Bytes
  provenance.metadataURI = historyMetadataURI

  if (customHistoryId) {
    // CustomHistory.load(event.params.customHistoryId)
    provenance.customHistory = customHistoryId.toString()
  }

  provenance.timestamp = timestampMillis
  provenance.createdAt = eventUTCMillis(event)

  provenance.save()
}

export function handleCustomHistoryType(
  event: CustomHistoryTypeCreatedEvent
): void {
  logInvocation("handleCustomHistoryType", event);

  let id = event.params.id.toString();

  let cht = new CustomHistoryType(id)
  cht.name = event.params.historyType
  cht.createdAt = eventUTCMillis(event)

  cht.save()
}

export function handleCustomHistory(event: CustomHistoryCreatedEvent): void {
  logInvocation("handleCustomHistory", event);

  let id = event.params.id.toString();

  let ch = new CustomHistory(id)
  ch.name = event.params.name
  ch.historyType = event.params.customHistoryTypeId.toString()
  ch.metadataDigest = event.params.metadataDigest
  ch.createdAt = eventUTCMillis(event)

  ch.save()
}

export function handleSRRCommitment(event: SRRCommitmentEvent): void {
  logInvocation("handleSRRCommitment", event);
  let params = event.params;
  handleSRRCommitmentInternal(
    event,
    params.owner,
    params.commitment,
    params.tokenId,
    null
  )
}

export function handleSRRCommitmentWithCustomHistory(
  event: SRRCommitmentWithCustomHistoryEvent
): void {
  logInvocation("handleSRRCommitmentWithCustomHistory", event);
  let params = event.params;
  handleSRRCommitmentInternal(
    event,
    params.owner,
    params.commitment,
    params.tokenId,
    params.customHistoryId
  )
}

function handleSRRCommitmentInternal(
  event: ethereum.Event,
  owner: Address,
  commitment: Bytes,
  tokenId: BigInt,
  customHistoryId: BigInt
): void {
  let srrId = tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId])
    return
  }

  log.info("SRRCommitment commitment = {}", [commitment.toHexString()])

  let blockTime = eventUTCMillis(event)

  srr.transferCommitment = commitment
  srr.updatedAt = blockTime
  srr.save()

  let srrCommit = SRRTransferCommit.load(srrId)
  if (srrCommit == null) {
    srrCommit = new SRRTransferCommit(srrId)
    srrCommit.createdAt = blockTime
  }

  srrCommit.commitment = srr.transferCommitment
  srrCommit.lastAction = "approve"

  if (customHistoryId != null) {
    srrCommit.customHistory = customHistoryId.toString()
  }

  srrCommit.updatedAt = blockTime
  srrCommit.save()
}

export function handleSRRCommitmentCancelled(
  event: SRRCommitmentCancelledEvent
): void {
  logInvocation("handleSRRCommitmentCancelled", event);
  let srrId = event.params.tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId])
    return
  }

  let blockTime = eventUTCMillis(event)

  srr.transferCommitment = null
  srr.updatedAt = blockTime
  srr.save()

  let srrCommit = SRRTransferCommit.load(srrId)
  if (srrCommit == null) {
    log.error(
      `received event but don't have corresponding SRRTransferCommit: {}`,
      [srrId]
    )
    return
  }

  srrCommit.lastAction = "cancel"
  srrCommit.commitment = null
  srrCommit.updatedAt = blockTime
  srrCommit.save()
}

export function handleUpdateSRR(event: UpdateSRREvent): void {
  logInvocation("handleUpdateSRR", event);
  let srrId = event.params.tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId])
    return
  }

  srr.artistAddress = event.params.registryRecord.artistAddress
  srr.isPrimaryIssuer = event.params.registryRecord.isPrimaryIssuer
  srr.updatedAt = eventUTCMillis(event)

  srr.save()
}

export function handleUpdateSRRMetadataDigest(
  event: UpdateSRRMetadataDigestEvent
): void {
  logInvocation("handleUpdateSRRMetadataDigest", event);
  let srrId = event.params.tokenId.toString();
  let srr = SRR.load(srrId);
  if (srr == null) {
    log.error("received event for unknown SRR: {}", [srrId])
    return
  }

  srr.updatedAt = eventUTCMillis(event)
  srr.metadataDigest = event.params.metadataDigest
  srr.save()

  saveSRRMetadataHistory(srr as SRR, event)
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
    .toHexString()

  let srrMetadataHistory = new SRRMetadataHistory(metadataHistoryId) // metadataHistoryId)
  srrMetadataHistory.srr = srr.id
  srrMetadataHistory.createdAt = eventUTCMillis(event)
  srrMetadataHistory.metadataDigest = Bytes.fromHexString(
    srr.metadataDigest.toHexString()
  ) as Bytes
  srrMetadataHistory.save()
}
