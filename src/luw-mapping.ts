
import { Bytes } from '@graphprotocol/graph-ts'

import { CreateLicensedUserWallet as CreateLUWEvent } from '../generated/LicensedUserEvent/LicensedUserEvent'
import { LicensedUserWallet } from '../generated/schema'

export function handleCreateLicensedUserWallet(event: CreateLUWEvent): void {
  let luwId = event.params.contractAddress.toHexString()
  
  let luw = new LicensedUserWallet(luwId)
  luw.contractAddress = event.params.contractAddress
  luw.requiredConfirmation = event.params.requiredConfirmation.toI32()
  luw.englishName = event.params.englishName
  luw.originalName = event.params.originalName
  luw.userType = event.params.userType
  luw.owners = event.params.owners as Array<Bytes>

  luw.createdAt = luw.updatedAt = event.block.timestamp
  
  luw.save()
}