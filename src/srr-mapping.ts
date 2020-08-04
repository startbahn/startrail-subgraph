import { crypto, log } from '@graphprotocol/graph-ts'

import {
  CreateSRR as CreateSRREvent,
  Provenance as SRRProvenanceEvent,
  SRRCommitment as SRRCommitmentEvent,
  SRRCommitmentCancelled as SRRCommitmentCancelledEvent,
  UpdateSRR as UpdateSRREvent,
  UpdateTokenURIIntegrityDigest as UpdateTokenURIIntegrityDigestEvent,
} from '../generated/RootLogic/RootLogic'
import { LicensedUserWallet, SRR, SRRProvenance } from '../generated/schema'
import { Transfer as TransferEvent } from '../generated/StartrailRegistry/StartrailRegistry'
import { byteArrayFromHex } from './utils'

export function handleTransfer(event: TransferEvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = event.params.tokenId
    srr.createdAt = event.block.timestamp.toI32()
  } else if (srr.transferCommitment != null) {
    srr.transferCommitment = null
  }
  srr.ownerAddress = event.params.to
  srr.updatedAt = event.block.timestamp.toI32()
  srr.save()
}

export function handleCreateSRR(event: CreateSRREvent): void {
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

  srr.updatedAt = event.block.timestamp.toI32()
  
  srr.save()
}

export function handleSRRProvenance(event: SRRProvenanceEvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [event.params.tokenId.toString()])
    return
  }

  let provenanceId = crypto.keccak256(
    byteArrayFromHex(
      event.params.tokenId.toString() + 
      event.params.timestamp.toString()
    )
  ).toHexString()
  
  let provenance = new SRRProvenance(provenanceId)

  provenance.srr = srr.id
  provenance.from = event.params.from
  provenance.to = event.params.to
  
  provenance.metadataDigest = event.params.historyMetadataDigest
  provenance.metadataURI = event.params.historyMetadataURI
  
  provenance.timestamp = event.params.timestamp.toI32()
  provenance.createdAt = event.block.timestamp.toI32()
  
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
  srr.updatedAt = event.block.timestamp.toI32()
  
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
  srr.updatedAt = event.block.timestamp.toI32()
  
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
  srr.updatedAt = event.block.timestamp.toI32()
  
  srr.save()
}

export function handleUpdateTokenURIIntegrityDigest(event: UpdateTokenURIIntegrityDigestEvent): void {
  let srrId = event.params.tokenId.toString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    log.error('received event for unknown SRR: {}', [event.params.tokenId.toString()])
    return
  }

  srr.metadataDigest = event.params.tokenURIIntegrityDigest

  srr.save()
}

