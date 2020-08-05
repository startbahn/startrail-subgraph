import {
  ByteArray,
  Bytes,
  crypto,
  ethereum,
  log,
} from '@graphprotocol/graph-ts'

import {
  CreateSRR as CreateSRREvent,
  Provenance as SRRProvenanceEvent,
  SRRCommitment as SRRCommitmentEvent,
  SRRCommitmentCancelled as SRRCommitmentCancelledEvent,
  UpdateSRR as UpdateSRREvent,
  UpdateTokenURIIntegrityDigest as UpdateTokenURIIntegrityDigestEvent,
} from '../generated/RootLogic/RootLogic'
import {
  LicensedUserWallet,
  SRR,
  SRRMetadataHistory,
  SRRProvenance,
} from '../generated/schema'
import { Transfer as TransferEvent } from '../generated/StartrailRegistry/StartrailRegistry'
import { eventUTCMillis } from './utils'

export function handleTransfer(event: TransferEvent): void {
  let timestampMillis = eventUTCMillis(event)
  let srrId = event.params.tokenId.toString()
  
  let srr = SRR.load(srrId)
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = srrId
    srr.createdAt = timestampMillis
  } else if (srr.transferCommitment != null) {
    srr.transferCommitment = null
  }

  srr.ownerAddress = event.params.to
  srr.updatedAt = timestampMillis
  srr.save()
}

export function handleCreateSRR(event: CreateSRREvent): void {
  //
  // Save SRR
  //
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)

  srr.artistAddress = event.params.registryRecord.artistAddress
  srr.isPrimaryIssuer = event.params.registryRecord.isPrimaryIssuer
  srr.metadataDigest = event.params.metadataDigest

  let issuerId = event.params.registryRecord.issuer.toHexString()
  let luw = LicensedUserWallet.load(issuerId)
  if (luw != null) {
    srr.issuer = luw.id
  }

  let blockTime = eventUTCMillis(event)
  srr.updatedAt = blockTime
  
  srr.save()

  saveSRRMetadataHistory(srr as SRR, event)
}

export function handleSRRProvenance(event: SRRProvenanceEvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [event.params.tokenId.toString()])
    return
  }

  let provenanceId = crypto.keccak256(
    ByteArray.fromUTF8(
      event.params.tokenId.toString() +
      event.params.timestamp.toString()
    )
  ).toHexString()
  
  let provenance = new SRRProvenance(provenanceId)

  provenance.srr = srr.id
  provenance.from = event.params.from
  provenance.to = event.params.to
  
  provenance.metadataDigest = Bytes.fromHexString(event.params.historyMetadataDigest) as Bytes
  provenance.metadataURI = event.params.historyMetadataURI
  
  provenance.timestamp = event.params.timestamp
  provenance.createdAt = eventUTCMillis(event)
  
  provenance.save()
}

export function handleSRRCommitment(event: SRRCommitmentEvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [event.params.tokenId.toString()])
    return
  }

  log.info('SRRCommitment commitment = {}', [event.params.commitment.toHexString()])

  srr.transferCommitment = event.params.commitment
  srr.updatedAt = eventUTCMillis(event)
  
  srr.save()
}

export function handleSRRCommitmentCancelled(event: SRRCommitmentCancelledEvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [event.params.tokenId.toString()])
    return
  }

  srr.transferCommitment = null
  srr.updatedAt = eventUTCMillis(event)
  
  srr.save()
}

export function handleUpdateSRR(event: UpdateSRREvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [event.params.tokenId.toString()])
    return
  }

  srr.artistAddress = event.params.registryRecord.artistAddress
  srr.isPrimaryIssuer = event.params.registryRecord.isPrimaryIssuer
  srr.updatedAt = eventUTCMillis(event)
  
  srr.save()
}

export function handleUpdateTokenURIIntegrityDigest(event: UpdateTokenURIIntegrityDigestEvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [event.params.tokenId.toString()])
    return
  }

  srr.updatedAt = eventUTCMillis(event)
  srr.metadataDigest = event.params.tokenURIIntegrityDigest
  srr.save()

  saveSRRMetadataHistory(srr as SRR, event)
}

function saveSRRMetadataHistory(srr: SRR, event: ethereum.Event): void {
  let metadataHistoryId = crypto.keccak256(
    ByteArray.fromUTF8(
      event.transaction.hash.toHexString() +
      event.logIndex.toHexString() +
      srr.metadataDigest.toHexString()
    )
  ).toHexString()

  let srrMetadataHistory = new SRRMetadataHistory(metadataHistoryId) // metadataHistoryId)
  srrMetadataHistory.srr = srr.id
  srrMetadataHistory.createdAt = eventUTCMillis(event)
  srrMetadataHistory.metadataDigest = Bytes.fromHexString(srr.metadataDigest.toHexString()) as Bytes
  srrMetadataHistory.save()
}

