
import { Bytes, log } from '@graphprotocol/graph-ts'

import { CreateLicensedUserWallet as CreateLUWEvent } from '../generated/LicensedUserEvent/LicensedUserEvent'
import { LicensedUserWallet } from '../generated/schema'
import { eventUTCMillis } from './utils'

export function handleCreateLicensedUserWallet(event: CreateLUWEvent): void {
  let luwId = event.params.contractAddress.toHexString()
  
  let luw = new LicensedUserWallet(luwId)
  luw.contractAddress = event.params.contractAddress
  luw.requiredConfirmation = event.params.requiredConfirmation.toI32()
  luw.englishName = event.params.englishName
  luw.originalName = event.params.originalName
  luw.owners = event.params.owners as Array<Bytes>

  let userType = event.params.userType
  switch(userType) {
    case 0:
      luw.userType = 'admin'
    case 1:
      luw.userType = 'handler'
    case 2:
      luw.userType = 'artist'
    default:
      log.error(`unhandled userType: {}`, [userType.toString()])
  }

  luw.createdAt = luw.updatedAt = eventUTCMillis(event)
 
  luw.save()
}