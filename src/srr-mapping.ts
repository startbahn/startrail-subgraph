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
  SRRHistory,
  SRRMetadataHistory,
  SRRProvenance,
  SRRTransferCommit,
} from '../generated/schema'
import {
  CreateCustomHistory as CustomHistoryCreatedEvent,
  CreateCustomHistoryFromMigration as CustomHistoryCreatedFromMigrationEvent,
  CreateCustomHistoryType as CustomHistoryTypeCreatedEvent,
  CreateSRR as CreateSRRWithLockExternalTransferEvent,
  CreateSRR1 as CreateSRREventLegacy,
  CreateSRRFromMigration as CreateSRRFromMigrationEvent,
  History as SRRHistoryEvent,
  LockExternalTransfer as LockExternalTransferEvent,
  MigrateSRR as MigrateSRREvent,
  Provenance as SRRProvenanceWithIntermediaryEvent,
  Provenance1 as SRRProvenanceWithCustomHistoryAndIntermediaryEvent,
  Provenance2 as SRRProvenanceEventLegacy,
  Provenance3 as SRRProvenanceWithCustomHistoryEventLegacy,
  ProvenanceDateMigrationFix as ProvenanceDateMigrationFixEvent,
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
import {
  currentChainId,
  eventUTCMillis,
  logInvocation,
  secondsToMillis,
  ZERO_ADDRESS,
} from './utils'

export function handleTransfer(event: TransferEvent): void {
  logInvocation('handleTransfer', event)

  const timestampMillis = eventUTCMillis(event)
  const srrId = event.params.tokenId.toString()
  const srrIdBigInt = event.params.tokenId

  const isMint = event.params.from.toHexString() == ZERO_ADDRESS.toHexString()

  let srr = SRR.load(srrId)
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = srrId
    srr.lockExternalTransfer = false

    srr.originChain = currentChainId()
    srr.originTxHash = event.transaction.hash

    if (isMint == true) {
      srr.createdAt = timestampMillis
    }
  }
  srr.ownerAddress = event.params.to
  srr.updatedAt = timestampMillis
  srr.save()

  if (isMint == false) {
    handleSRRProvenanceInternal(
      timestampMillis,
      srrIdBigInt,
      event.params.from,
      event.params.to,
      null,
      null,
      null,
      false
    )
    checkAndClearCommitOnTransfer(srr as SRR, timestampMillis)
    srr.save()
  }
}

export function handleTransferFromMigration(
  event: TransferFromMigrationEvent
): void {
  logInvocation('handleTransferFromMigration', event)
  const originTimestampMillis = secondsToMillis(event.params.originTimestamp)

  const srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)

  // In the normal case where a Transfer is emitted before a CreateSRR.
  // However due to a Mainnet migration in Oct 2020 sometimes this order is
  // flipped. So we handle this case here by creating the entity.
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = srrId
    srr.createdAt = originTimestampMillis
    srr.originChain = currentChainId()
    srr.originTxHash = event.params.originTxHash
  }

  if (event.params.from.toHexString() != ZERO_ADDRESS.toHexString()) {
    checkAndClearCommitOnTransfer(srr as SRR, originTimestampMillis)
  }

  srr.ownerAddress = event.params.to
  srr.updatedAt = originTimestampMillis

  srr.save()
}

function checkAndClearCommitOnTransfer(srr: SRR, eventTime: BigInt): void {
  log.info('clearing transferCommitment on token = {}', [srr.tokenId as string])
  const srrCommit = SRRTransferCommit.load(srr.tokenId as string)
  if (srrCommit != null) {
    srrCommit.commitment = null
    srrCommit.lastAction = 'transfer'
    srrCommit.updatedAt = eventTime
    srrCommit.save()
  }
  srr.transferCommitment = null
}

export function handleCreateSRR(event: CreateSRREventLegacy): void {
  logInvocation('handleCreateSRR', event)

  const timestampMillis = eventUTCMillis(event)
  const srrId = event.params.tokenId.toString()
  const srr = SRR.load(srrId)

  saveCreateSRRInternal(
    srr as SRR,
    event.params.registryRecord.isPrimaryIssuer,
    event.params.registryRecord.artistAddress,
    event.params.registryRecord.issuer,
    event.params.metadataDigest,
    false,
    timestampMillis,
    event
  )
}

export function handleCreateSRRWithLockExternalTransfer(
  event: CreateSRRWithLockExternalTransferEvent
): void {
  logInvocation('handleCreateSRRWithLockExternalTransfer', event)

  const timestampMillis = eventUTCMillis(event)
  const srrId = event.params.tokenId.toString()
  const srr = SRR.load(srrId)

  saveCreateSRRInternal(
    srr as SRR,
    event.params.registryRecord.isPrimaryIssuer,
    event.params.registryRecord.artistAddress,
    event.params.registryRecord.issuer,
    event.params.metadataDigest,
    event.params.lockExternalTransfer,
    timestampMillis,
    event
  )
}

export function handleCreateSRRFromMigration(
  event: CreateSRRFromMigrationEvent
): void {
  logInvocation('handleCreateSRRFromMigration', event)

  const timestampMillis = secondsToMillis(event.params.originTimestamp)
  const srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)

  // In the normal case where a Transfer is emitted before a CreateSRR.
  // However due to a Mainnet migration in Oct 2020 sometimes this order is
  // flipped. So we handle this case here by creating the entity.
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = srrId
    srr.createdAt = timestampMillis
    srr.originTxHash = event.params.originTxHash
  }

  saveCreateSRRInternal(
    srr as SRR,
    event.params.registryRecord.isPrimaryIssuer,
    event.params.registryRecord.artistAddress,
    event.params.registryRecord.issuer,
    event.params.metadataDigest,
    false,
    timestampMillis,
    event
  )
}

function saveCreateSRRInternal(
  srr: SRR,
  isPrimaryIssuer: boolean,
  artist: Address,
  issuer: Address,
  metadataDigest: Bytes,
  lockExternalTransfer: boolean,
  updateTimestamp: BigInt,
  event: ethereum.Event
): void {
  srr.isPrimaryIssuer = isPrimaryIssuer
  srr.metadataDigest = metadataDigest
  srr.lockExternalTransfer = lockExternalTransfer

  srr.artistAddress = artist
  srr.artist = getLicensedUserIdFromAddress(artist)
  srr.issuer = getLicensedUserIdFromAddress(issuer)

  srr.updatedAt = updateTimestamp
  srr.save()

  saveSRRMetadataHistory(srr as SRR, updateTimestamp, event)
}

function getLicensedUserIdFromAddress(address: Address): string | null {
  const id = address.toHexString()
  const luw = LicensedUserWallet.load(id)
  return luw == null ? null : luw.id
}

export function handleSRRProvenance(event: SRRProvenanceEventLegacy): void {
  logInvocation('handleSRRProvenance', event)
  const params = event.params
  handleSRRProvenanceInternal(
    eventUTCMillis(event),
    params.tokenId,
    params.from,
    params.to,
    null,
    params.historyMetadataDigest,
    params.historyMetadataURI,
    false
  )
}

export function handleSRRProvenanceWithCustomHistory(
  event: SRRProvenanceWithCustomHistoryEventLegacy
): void {
  logInvocation('handleSRRProvenanceWithCustomHistory', event)
  const params = event.params
  handleSRRProvenanceInternal(
    eventUTCMillis(event),
    params.tokenId,
    params.from,
    params.to,
    params.customHistoryId,
    params.historyMetadataDigest,
    params.historyMetadataURI,
    false
  )
}

export function handleSRRProvenanceWithIntermediary(
  event: SRRProvenanceWithIntermediaryEvent
): void {
  logInvocation('handleSRRProvenance', event)
  const params = event.params
  handleSRRProvenanceInternal(
    eventUTCMillis(event),
    params.tokenId,
    params.from,
    params.to,
    null,
    params.historyMetadataDigest,
    params.historyMetadataURI,
    params.isIntermediary
  )
}

export function handleSRRProvenanceWithCustomHistoryAndIntermediary(
  event: SRRProvenanceWithCustomHistoryAndIntermediaryEvent
): void {
  logInvocation('handleSRRProvenanceWithCustomHistory', event)
  const params = event.params
  handleSRRProvenanceInternal(
    eventUTCMillis(event),
    params.tokenId,
    params.from,
    params.to,
    params.customHistoryId,
    params.historyMetadataDigest,
    params.historyMetadataURI,
    params.isIntermediary
  )
}

/**
 * Can't use a union type to handle the 2 Provenance events with one function.
 *
 * So this function exists to handle both with a superset of the
 * available parameters.
 */
function handleSRRProvenanceInternal(
  eventTimestampMillis: BigInt,
  tokenId: BigInt,
  from: Address,
  to: Address,
  customHistoryId: BigInt | null,
  historyMetadataDigest: string | null,
  historyMetadataURI: string | null,
  isIntermediary: boolean
): void {
  const srrId = tokenId.toString()
  const srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [srrId])
    return
  }

  // Update existing SRR
  srr.ownerAddress = to
  srr.updatedAt = eventTimestampMillis
  srr.save()

  // Create new Provenance if we can't find srrProvenance with provenanceId.
  // This is because we need to create a provenance entity even if the transfer event is emitted to be compatible with opensea.
  const provenanceId = crypto
    .keccak256(
      ByteArray.fromUTF8(tokenId.toString() + eventTimestampMillis.toString())
    )
    .toHexString()
  let provenance = SRRProvenance.load(provenanceId)
  if (!provenance) {
    provenance = new SRRProvenance(provenanceId)

    provenance.srr = srr.id
    provenance.from = from
    provenance.to = to

    if (historyMetadataDigest) {
      provenance.metadataDigest = Bytes.fromHexString(
        historyMetadataDigest
      ) as Bytes
    } else {
      provenance.metadataDigest = new Bytes(0)
    }

    if (historyMetadataURI) {
      provenance.metadataURI = historyMetadataURI
    } else {
      provenance.metadataURI = ''
    }

    if (customHistoryId) {
      // CustomHistory.load(event.params.customHistoryId)
      provenance.customHistory = customHistoryId.toString()
    }
    provenance.isIntermediary = isIntermediary

    provenance.timestamp = eventTimestampMillis
    provenance.createdAt = eventTimestampMillis

    provenance.save()
  }
}

export function handleSRRProvenanceFromMigration(
  event: SRRProvenanceFromMigrationEvent
): void {
  logInvocation('handleSRRProvenanceFromMigration', event)
  const params = event.params
  handleSRRProvenanceInternal(
    secondsToMillis(event.params.originTimestamp),
    params.tokenId,
    params.from,
    params.to,
    null,
    params.historyMetadataDigest,
    params.historyMetadataURI,
    false
  )
}

export function handleSRRProvenanceWithCustomHistoryFromMigration(
  event: SRRProvenanceWithCustomHistoryFromMigrationEvent
): void {
  logInvocation('handleSRRProvenanceWithCustomHistoryFromMigration', event)
  const params = event.params
  handleSRRProvenanceInternal(
    secondsToMillis(event.params.originTimestamp),
    params.tokenId,
    params.from,
    params.to,
    params.customHistoryId,
    params.historyMetadataDigest,
    params.historyMetadataURI,
    false
  )
}

export function handleCustomHistoryType(
  event: CustomHistoryTypeCreatedEvent
): void {
  logInvocation('handleCustomHistoryType', event)

  const id = event.params.id.toString()

  const cht = new CustomHistoryType(id)
  cht.name = event.params.historyType
  cht.createdAt = eventUTCMillis(event)

  cht.save()
}

export function handleCreateCustomHistory(
  event: CustomHistoryCreatedEvent
): void {
  logInvocation('handleCreateCustomHistory', event)
  handleCreateCustomHistoryInternal(
    eventUTCMillis(event),
    event.params.id,
    event.params.name,
    event.params.customHistoryTypeId,
    event.params.metadataDigest,
    currentChainId(),
    event.transaction.hash
  )
}

export function handleCreateCustomHistoryFromMigration(
  event: CustomHistoryCreatedFromMigrationEvent
): void {
  logInvocation('handleCreateCustomHistoryFromMigration', event)
  handleCreateCustomHistoryInternal(
    secondsToMillis(event.params.originTimestamp),
    event.params.id,
    event.params.name,
    event.params.customHistoryTypeId,
    event.params.metadataDigest,
    event.params.originChain,
    event.params.originTxHash
  )
}

function handleCreateCustomHistoryInternal(
  eventTimestampMillis: BigInt,
  id: BigInt,
  name: string,
  customHistoryTypeId: BigInt,
  metadataDigest: Bytes,
  originChain: string,
  originTxHash: Bytes
): void {
  const ch = new CustomHistory(id.toString())
  ch.name = name
  ch.historyType = customHistoryTypeId.toString()
  ch.metadataDigest = metadataDigest
  ch.originChain = originChain
  ch.originTxHash = originTxHash
  ch.createdAt = eventTimestampMillis
  ch.save()
}

export function handleSRRHistory(event: SRRHistoryEvent): void {
  logInvocation('handleSRRHistory', event)

  const tokenIds = event.params.tokenIds
  const customHistoryIds = event.params.customHistoryIds

  for (let tokenIdsIdx = 0; tokenIdsIdx < tokenIds.length; tokenIdsIdx++) {
    const tokenId = tokenIds[tokenIdsIdx].toString()
    for (
      let customHistoryIdsIdx = 0;
      customHistoryIdsIdx < customHistoryIds.length;
      customHistoryIdsIdx++
    ) {
      const customHistoryId = customHistoryIds[customHistoryIdsIdx].toString()
      const historyId = crypto
        .keccak256(ByteArray.fromUTF8(tokenId + customHistoryId))
        .toHexString()

      const history = new SRRHistory(historyId)
      history.srr = tokenId
      history.customHistory = customHistoryId
      history.createdAt = eventUTCMillis(event)
      history.save()
    }
  }
}

export function handleSRRCommitment(event: SRRCommitmentEvent): void {
  logInvocation('handleSRRCommitment', event)
  const params = event.params
  handleSRRCommitmentInternal(
    eventUTCMillis(event),
    params.commitment,
    params.tokenId,
    null
  )
}

export function handleSRRCommitmentWithCustomHistory(
  event: SRRCommitmentWithCustomHistoryEvent
): void {
  logInvocation('handleSRRCommitmentWithCustomHistory', event)
  const params = event.params
  handleSRRCommitmentInternal(
    eventUTCMillis(event),
    params.commitment,
    params.tokenId,
    params.customHistoryId
  )
}

function handleSRRCommitmentInternal(
  eventTimestampMillis: BigInt,
  commitment: Bytes,
  tokenId: BigInt,
  customHistoryId: BigInt | null
): void {
  const srrId = tokenId.toString()
  const srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [srrId])
    return
  }

  log.info('SRRCommitment commitment = {}', [commitment.toHexString()])

  srr.transferCommitment = commitment
  srr.updatedAt = eventTimestampMillis
  srr.save()

  let srrCommit = SRRTransferCommit.load(srrId)
  if (srrCommit == null) {
    srrCommit = new SRRTransferCommit(srrId)
    srrCommit.createdAt = eventTimestampMillis
  }

  srrCommit.commitment = srr.transferCommitment
  srrCommit.lastAction = 'approve'

  if (customHistoryId != null) {
    srrCommit.customHistory = customHistoryId.toString()
  }

  srrCommit.updatedAt = eventTimestampMillis
  srrCommit.save()
}

export function handleSRRCommitmentFromMigration(
  event: SRRCommitmentFromMigrationEvent
): void {
  logInvocation('handleSRRCommitmentFromMigration', event)
  const params = event.params
  handleSRRCommitmentInternal(
    secondsToMillis(event.params.originTimestamp),
    params.commitment,
    params.tokenId,
    null
  )
}

export function handleSRRCommitmentWithCustomHistoryFromMigration(
  event: SRRCommitmentWithCustomHistoryFromMigrationEvent
): void {
  logInvocation('handleSRRCommitmentWithCustomHistoryFromMigration', event)
  const params = event.params
  handleSRRCommitmentInternal(
    secondsToMillis(event.params.originTimestamp),
    params.commitment,
    params.tokenId,
    params.customHistoryId
  )
}

export function handleSRRCommitmentCancelled(
  event: SRRCommitmentCancelledEvent
): void {
  logInvocation('handleSRRCommitmentCancelled', event)
  handleSRRCommitmentCancelledInternal(
    eventUTCMillis(event),
    event.params.tokenId
  )
}

export function handleSRRCommitmentCancelledFromMigration(
  event: SRRCommitmentCancelledFromMigrationEvent
): void {
  logInvocation('handleSRRCommitmentCancelledFromMigration', event)
  handleSRRCommitmentCancelledInternal(
    secondsToMillis(event.params.originTimestamp),
    event.params.tokenId
  )
}

function handleSRRCommitmentCancelledInternal(
  eventTimestampMillis: BigInt,
  tokenId: BigInt
): void {
  const srrId = tokenId.toString()
  const srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [srrId])
    return
  }

  srr.transferCommitment = null
  srr.updatedAt = eventTimestampMillis
  srr.save()

  const srrCommit = SRRTransferCommit.load(srrId)
  if (srrCommit == null) {
    log.error(
      `received event but don't have corresponding SRRTransferCommit: {}`,
      [srrId]
    )
    return
  }

  srrCommit.lastAction = 'cancel'
  srrCommit.commitment = null
  srrCommit.updatedAt = eventTimestampMillis
  srrCommit.save()
}

export function handleUpdateSRR(event: UpdateSRREvent): void {
  logInvocation('handleUpdateSRR', event)
  handleUpdateSRRInternal(
    eventUTCMillis(event),
    event.params.registryRecord.isPrimaryIssuer,
    event.params.registryRecord.artistAddress,
    event.params.tokenId
  )
}

export function handleUpdateSRRFromMigration(
  event: UpdateSRRFromMigrationEvent
): void {
  logInvocation('handleUpdateSRRFromMigration', event)
  handleUpdateSRRInternal(
    secondsToMillis(event.params.originTimestamp),
    event.params.registryRecord.isPrimaryIssuer,
    event.params.registryRecord.artistAddress,
    event.params.tokenId
  )
}

function handleUpdateSRRInternal(
  eventTimestampMillis: BigInt,
  isPrimaryIssuer: boolean,
  artistAddress: Address,
  tokenId: BigInt
): void {
  const srrId = tokenId.toString()
  const srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [srrId])
    return
  }

  srr.isPrimaryIssuer = isPrimaryIssuer
  srr.artistAddress = artistAddress
  srr.updatedAt = eventTimestampMillis

  srr.save()
}

export function handleUpdateSRRMetadataDigest(
  event: UpdateSRRMetadataDigestEvent
): void {
  logInvocation('handleUpdateSRRMetadataDigest', event)
  handleUpdateSRRMetadataDigestInternal(
    eventUTCMillis(event),
    event.params.tokenId,
    event.params.metadataDigest,
    event
  )
}

export function handleUpdateSRRMetadataDigestFromMigration(
  event: UpdateSRRMetadataDigestFromMigrationEvent
): void {
  logInvocation('handleUpdateSRRMetadataDigestFromMigration', event)
  handleUpdateSRRMetadataDigestInternal(
    secondsToMillis(event.params.originTimestamp),
    event.params.tokenId,
    event.params.metadataDigest,
    event
  )
}

function handleUpdateSRRMetadataDigestInternal(
  eventTimestampMillis: BigInt,
  tokenId: BigInt,
  metadataDigest: Bytes,
  event: ethereum.Event
): void {
  const srrId = tokenId.toString()
  const srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [srrId])
    return
  }

  srr.updatedAt = eventTimestampMillis
  srr.metadataDigest = metadataDigest
  srr.save()

  saveSRRMetadataHistory(srr as SRR, eventTimestampMillis, event)
}

function saveSRRMetadataHistory(
  srr: SRR,
  eventTimestampMillis: BigInt,
  event: ethereum.Event
): void {
  const metadataHistoryId = crypto
    .keccak256(
      ByteArray.fromUTF8(
        event.transaction.hash.toHexString() +
          event.logIndex.toHexString() +
          (srr.metadataDigest as Bytes).toHexString()
      )
    )
    .toHexString()

  const srrMetadataHistory = new SRRMetadataHistory(metadataHistoryId) // metadataHistoryId)
  srrMetadataHistory.srr = srr.id
  srrMetadataHistory.createdAt = eventTimestampMillis
  srrMetadataHistory.metadataDigest = Bytes.fromHexString(
    (srr.metadataDigest as Bytes).toHexString()
  ) as Bytes
  srrMetadataHistory.save()
}

export function handleMigrateSRR(event: MigrateSRREvent): void {
  logInvocation('handleMigrateSRR', event)
  const srrId = event.params.tokenId.toString()
  const srr = SRR.load(srrId)
  if (srr) {
    srr.originChain = event.params.originChain
    srr.save()
  }
}

export function handleProvenanceDateMigrationFix(
  event: ProvenanceDateMigrationFixEvent
): void {
  logInvocation('handleProvenanceDateMigrationFix', event)
  const provenanceId = crypto
    .keccak256(ByteArray.fromUTF8(event.params.tokenId.toString() + '66000'))
    .toHexString()
  const prov = SRRProvenance.load(provenanceId)
  if (prov == null) {
    log.error('received fix event but provenance not found: {}', [provenanceId])
    return
  }
  prov.createdAt = event.params.originTimestamp
  prov.timestamp = event.params.originTimestamp
  prov.save()
}

export function handleLockExternalTransfer(
  event: LockExternalTransferEvent
): void {
  logInvocation('handleLockExternalTransfer', event)
  const srrId = event.params.tokenId.toString()
  const srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received lock external transfer event but srr not found: {}', [
      srrId,
    ])
    return
  }
  srr.lockExternalTransfer = event.params.flag
  srr.save()
}
