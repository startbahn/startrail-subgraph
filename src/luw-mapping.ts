import { BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import {
  AddedOwner as AddedOwnerEvent,
  ChangedThreshold as ChangedThresholdEvent,
  CreateLicensedUserWallet as CreateLUWEvent,
  MigrateLicensedUserWallet as MigrateLicensedUserWalletEvent,
  RemovedOwner as RemovedOwnerEvent,
  UpdateLicensedUserDetail as UpdateLicensedUserDetailEvent,
  UpgradeLicensedUserWalletToMulti as UpgradeLicensedUserWalletToMultiEvent,
} from '../generated/LicensedUserManager/LicensedUserManager'
import { LicensedUserWallet } from '../generated/schema'
import { eventUTCMillis, logInvocation, secondsToMillis } from './utils'

function userType(n: i32): string {
  switch (n) {
    case 0:
      return 'handler'
    case 1:
      return 'artist'
    default:
      log.error(`unhandled userType: {}`, [n.toString()])
      return ''
  }
}

export function handleCreateLicensedUserWallet(event: CreateLUWEvent): void {
  logInvocation('handleCreateLicensedUserWallet', event)

  const timestampMillis = eventUTCMillis(event)
  const luwId = event.params.walletAddress.toHexString()
  let luw = LicensedUserWallet.load(luwId)

  // New wallet (not a migration from legacy)
  // If it's a migration we skip setting these values as they are already set
  if (luw == null) {
    log.info('creating new LUW [{}, {}]', [event.params.originalName, luwId])
    luw = new LicensedUserWallet(luwId)
    luw.walletAddress = event.params.walletAddress
    luw.englishName = event.params.englishName
    luw.originalName = event.params.originalName
    luw.owners = event.params.owners as Array<Bytes>
    luw.threshold = event.params.threshold
    luw.createdAt = timestampMillis
  } else {
    log.info('migrating legacy LUW {}', [luwId])
  }

  luw.userType = userType(event.params.userType)
  luw.salt = event.params.salt
  luw.updatedAt = timestampMillis

  luw.save()
}

export function handleAddedOwner(event: AddedOwnerEvent): void {
  logInvocation('handleAddedOwner', event)

  const luwId = event.params.wallet.toHexString()
  const luw = LicensedUserWallet.load(luwId)

  if (luw == null) {
    log.error('received AddedOwner event for unknown LUW: {}', [luwId])
    return
  }

  const owner = event.params.owner
  log.info('adding owner [{}] to LUW [{}]', [owner.toHexString(), luwId])

  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  const owners = luw.owners
  owners.push(owner)
  luw.owners = owners

  luw.updatedAt = eventUTCMillis(event)
  luw.save()
}

export function handleRemovedOwner(event: RemovedOwnerEvent): void {
  logInvocation('handleRemovedOwner', event)

  const luwId = event.params.wallet.toHexString()
  const luw = LicensedUserWallet.load(luwId)

  if (luw == null) {
    log.error('received RemovedOwner event for unknown LUW: {}', [luwId])
    return
  }

  const owner = event.params.owner
  const ownerIdx = luw.owners.indexOf(owner)
  if (ownerIdx == -1) {
    log.error('owner in RemovedOwner [{}] is not in the indexed owner list', [
      owner.toHexString(),
    ])
    return
  }

  log.info('removing owner [{}] to LUW [{}]', [owner.toHexString(), luwId])

  // assign to separate variable is required when updating array, see here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  const owners = luw.owners
  owners.splice(ownerIdx, 1)
  luw.owners = owners

  luw.updatedAt = eventUTCMillis(event)
  luw.save()
}

export function handleChangedThreshold(event: ChangedThresholdEvent): void {
  logInvocation('handleChangedThreshold', event)

  const luwId = event.params.wallet.toHexString()
  const luw = LicensedUserWallet.load(luwId)

  if (luw == null) {
    log.error('received ChangedThreshold event for unknown LUW: {}', [luwId])
    return
  }

  log.info('changing threshold to [{}] for LUW [{}]', [
    BigInt.fromI32(event.params.threshold).toString(),
    luwId,
  ])
  luw.threshold = event.params.threshold
  luw.updatedAt = eventUTCMillis(event)
  luw.save()
}

export function handleUpgradeLicensedUserWalletToMulti(
  event: UpgradeLicensedUserWalletToMultiEvent
): void {
  logInvocation('handleUpgradeLicensedUserWalletToMulti', event)

  const luwId = event.params.walletAddress.toHexString()
  const luw = LicensedUserWallet.load(luwId)
  if (luw == null) {
    log.error(
      'received UpgradeLicensedUserWalletToMulti event for unknown LUW: {}',
      [luwId]
    )
    return
  }

  log.info('upgrading LUW {} to multi signer', [luwId])
  luw.owners = event.params.owners as Array<Bytes>
  luw.threshold = event.params.threshold
  luw.updatedAt = eventUTCMillis(event)
  luw.save()
}

export function handleUpdateLicensedUserDetail(
  event: UpdateLicensedUserDetailEvent
): void {
  logInvocation('handleUpdateLicensedUserDetail', event)

  const luwId = event.params.walletAddress.toHexString()
  const luw = LicensedUserWallet.load(luwId)
  if (luw == null) {
    log.error('received UpdateLicensedUserDetail event for unknown LUW: {}', [
      luwId,
    ])
    return
  }

  log.info('updating LUW {} {} to {}', [
    luwId,
    event.params.key,
    event.params.value,
  ])

  if (event.params.key == 'englishName') {
    luw.englishName = event.params.value
  } else if (event.params.key == 'originalName') {
    luw.originalName = event.params.value
  }

  luw.updatedAt = eventUTCMillis(event)
  luw.save()
}

export function handleMigrateLicensedUser(
  event: MigrateLicensedUserWalletEvent
): void {
  logInvocation('handleMigrateLicensedUser', event)
  const luwId = event.params.walletAddress.toHexString()
  const luw = LicensedUserWallet.load(luwId)

  const createTime = secondsToMillis(event.params.originTimestamp)
  luw.createdAt = createTime
  luw.updatedAt = createTime

  luw.originChain = event.params.originChain

  luw.save()
}
