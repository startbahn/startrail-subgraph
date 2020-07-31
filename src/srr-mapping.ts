import { CreateSRR } from '../generated/RootLogic/RootLogic'
import { LicensedUserWallet, SRR } from '../generated/schema'
import { Transfer } from '../generated/StartrailRegistry/StartrailRegistry'

export function handleTransfer(event: Transfer): void {
  let srrId = event.params.tokenId.toHexString()
  let srr = SRR.load(srrId)
  if (srr == null) {
    srr = new SRR(srrId)
    srr.tokenId = event.params.tokenId
  }
  srr.ownerAddress = event.params.to
  srr.save()
}

export function handleCreateSRR(event: CreateSRR): void {
  let srrId = event.params.tokenId.toHexString()
  let srr = SRR.load(srrId)

  srr.artistAddress = event.params.registryRecord.artistAddress
  srr.isPrimaryIssuer = event.params.registryRecord.isPrimaryIssuer
  srr.metadataDigest = event.params.metadataDigest

  let issuerId = event.params.registryRecord.issuer.toHexString()
  let luw = LicensedUserWallet.load(issuerId)
  if (luw != null) {
    srr.issuer = luw.id
  }
  
  srr.save()
}
