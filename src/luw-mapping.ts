import { BigInt, Bytes, log, store } from '@graphprotocol/graph-ts'

import {
  CreateLicensedUserWallet as LegacyCreateLUWEvent,
  MultiSigOwnerAddition as MultiSigOwnerAdditionEvent,
} from '../generated/LicensedUserEvent/LicensedUserEvent'
import {
  AddedOwner as AddedOwnerEvent,
  ChangedThreshold as ChangedThresholdEvent,
  CreateLicensedUserWallet as CreateLUWEvent,
  ExecutionSuccess as ExecutionSuccessEvent,
  RemovedOwner as RemovedOwnerEvent,
  RequestTypeRegistered as RequestTypeRegisteredEvent,
  RequestTypeUnregistered as RequestTypeUnregisteredEvent,
  UpdateEnglishName as UpdateEnglishNameEvent,
  UpdateOriginalName as UpdateOriginalNameEvent,
  UpgradeLicensedUserWalletToMulti as UpgradeLicensedUserWalletToMultiEvent,
} from '../generated/LicensedUserManager/LicensedUserManager'
import {
  LicensedUserWallet,
  MetaTxExecution,
  MetaTxRequestType,
} from '../generated/schema'
import { eventUTCMillis } from './utils'

function userType(n: i32): string {
  switch (n) {
    case 0:
      return "handler";
    case 1:
      return "artist";
    default:
      log.error(`unhandled userType: {}`, [n.toString()]);
      return "";
  }
}

function legacyUserType(n: i32): string {
  switch (n) {
    case 0:
      return "admin";
    case 1:
      return "handler";
    case 2:
      return "artist";
    default:
      log.error(`unhandled legacyUserType: {}`, [n.toString()]);
      return "";
  }
}

export function handleCreateLicensedUserWallet(event: CreateLUWEvent): void {
  let timestampMillis = eventUTCMillis(event);
  let luwId = event.params.walletAddress.toHexString();
  let luw = LicensedUserWallet.load(luwId);

  // New wallet (not a migration from legacy)
  // If it's a migration we skip setting these values as they are already set
  if (luw == null) {
    log.info("creating new LUW [{}, {}]", [event.params.originalName, luwId]);
    luw = new LicensedUserWallet(luwId);
    luw.walletAddress = event.params.walletAddress;
    luw.englishName = event.params.englishName;
    luw.originalName = event.params.originalName;
    luw.owners = event.params.owners as Array<Bytes>;
    luw.threshold = event.params.threshold;
    luw.createdAt = timestampMillis;
  } else {
    log.info("migrating legacy LUW {}", [luwId]);
  }

  luw.userType = userType(event.params.userType);
  luw.updatedAt = timestampMillis;

  luw.save();
}

export function handleAddedOwner(event: AddedOwnerEvent): void {
  let luwId = event.params.wallet.toHexString();
  let luw = LicensedUserWallet.load(luwId);

  if (luw == null) {
    log.error("received AddedOwner event for unknown LUW: {}", [luwId]);
    return;
  }

  let owner = event.params.owner;
  log.info("adding owner [{}] to LUW [{}]", [owner.toHexString(), luwId]);

  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  let owners = luw.owners;
  owners.push(owner);
  luw.owners = owners;

  luw.updatedAt = eventUTCMillis(event);
  luw.save();
}

export function handleRemovedOwner(event: RemovedOwnerEvent): void {
  let luwId = event.params.wallet.toHexString();
  let luw = LicensedUserWallet.load(luwId);

  if (luw == null) {
    log.error("received RemovedOwner event for unknown LUW: {}", [luwId]);
    return;
  }

  let owner = event.params.owner;
  let ownerIdx = luw.owners.indexOf(owner);
  if (ownerIdx == -1) {
    log.error("owner in RemovedOwner [{}] is not in the indexed owner list", [
      owner.toHexString(),
    ]);
    return;
  }

  log.info("removing owner [{}] to LUW [{}]", [owner.toHexString(), luwId]);

  // assign to separate variable is required when updating array, see here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):

  // TODO: does this work? or need to assign to a separate array first ...?
  luw.owners = luw.owners.splice(ownerIdx, 1);
  luw.updatedAt = eventUTCMillis(event);
  luw.save();
}

export function handleChangedThreshold(event: ChangedThresholdEvent): void {
  let luwId = event.params.wallet.toHexString();
  let luw = LicensedUserWallet.load(luwId);

  if (luw == null) {
    log.error("received ChangedThreshold event for unknown LUW: {}", [luwId]);
    return;
  }

  let threshold = BigInt.fromI32(event.params.threshold);
  log.info("changing threshold to [{}] for LUW [{}]", [
    threshold.toString(),
    luwId,
  ]);
  luw.threshold = threshold;
  luw.updatedAt = eventUTCMillis(event);
  luw.save();
}

export function handleUpgradeLicensedUserWalletToMulti(
  event: UpgradeLicensedUserWalletToMultiEvent
): void {
  let luwId = event.params.walletAddress.toHexString();
  let luw = LicensedUserWallet.load(luwId);
  if (luw == null) {
    log.error(
      "received UpgradeLicensedUserWalletToMulti event for unknown LUW: {}",
      [luwId]
    );
    return;
  }

  log.info("upgrading LUW {} to multi signer", [luwId]);
  luw.owners = event.params.owners as Array<Bytes>;
  luw.threshold = event.params.threshold;
  luw.updatedAt = eventUTCMillis(event);
  luw.save();
}

export function handleUpdateEnglishName(event: UpdateEnglishNameEvent): void {
  let luwId = event.params.walletAddress.toHexString();
  let luw = LicensedUserWallet.load(luwId);
  if (luw == null) {
    log.error("received UpdateEnglishName event for unknown LUW: {}", [luwId]);
    return;
  }

  log.info("updating LUW {} englishName to {}", [luwId, event.params.name]);
  luw.englishName = event.params.name;
  luw.updatedAt = eventUTCMillis(event);
  luw.save();
}

export function handleUpdateOriginalName(event: UpdateOriginalNameEvent): void {
  let luwId = event.params.walletAddress.toHexString();
  let luw = LicensedUserWallet.load(luwId);
  if (luw == null) {
    log.error("received UpdateOriginalName event for unknown LUW: {}", [luwId]);
    return;
  }

  log.info("updating LUW {} originalName to {}", [luwId, event.params.name]);
  luw.originalName = event.params.name;
  luw.updatedAt = eventUTCMillis(event);
  luw.save();
}

export function handleRequestTypeRegistered(
  event: RequestTypeRegisteredEvent
): void {
  let typeHash = event.params.typeHash;
  let requestType = new MetaTxRequestType(typeHash.toHexString());
  requestType.typeHash = typeHash;
  requestType.typeString = event.params.typeStr;

  log.info("creating MetaTxRequestType hash [{}] typeString [{}]", [
    requestType.typeHash.toHexString(),
    requestType.typeString,
  ]);
  requestType.createdAt = eventUTCMillis(event);
  requestType.save();
}

export function handleRequestTypeUnregistered(
  event: RequestTypeUnregisteredEvent
): void {
  let requestTypeId = event.params.typeHash.toHexString();
  let requestType = MetaTxRequestType.load(requestTypeId);
  if (requestType == null) {
    log.error(
      "received ReqestTypeUnregistered for unknown MetaTxRequestType: {}",
      [requestTypeId]
    );
    return;
  }

  log.info("removing MetaTxRequestType hash [{}] typeString [{}]", [
    requestType.typeHash.toHexString(),
    requestType.typeString,
  ]);
  store.remove("MetaTxRequestType", requestTypeId);
}

export function handleExecutionSuccess(event: ExecutionSuccessEvent): void {
  let txHash = event.params.txHash;
  let execution = new MetaTxExecution(txHash.toHexString());
  execution.txHash = txHash;
  log.info("creating MetaTxExecution hash [{}]", [txHash.toHexString()]);
  execution.createdAt = eventUTCMillis(event);
  execution.save();
}

/* --------------------------------------------------------------------
 * Legacy handlers
 * --------------------------------------------------------------------*/

export function legacyHandleCreateLicensedUserWallet(
  event: LegacyCreateLUWEvent
): void {
  let luwId = event.params.contractAddress.toHexString();

  let luw = new LicensedUserWallet(luwId);
  luw.walletAddress = event.params.contractAddress;
  luw.threshold = event.params.requiredConfirmation;
  luw.englishName = event.params.englishName;
  luw.originalName = event.params.originalName;
  luw.owners = event.params.owners as Array<Bytes>;
  luw.userType = legacyUserType(event.params.userType);
  luw.createdAt = luw.updatedAt = eventUTCMillis(event);

  log.info("creating new LUW (legacy) {}", [luwId]);
  luw.save();
}

export function handleOwnerAddition(event: MultiSigOwnerAdditionEvent): void {
  let luwId = event.params.proxyContractAddr.toHexString();
  let luw = LicensedUserWallet.load(luwId);
  if (luw == null) {
    log.error("received event for unknown LUW: {}", [luwId]);
    return;
  }

  log.info("adding owner {}", [event.params.owner.toHexString()]);
  // this 3 step assign, push, reassign is necessary here:
  // (see https://thegraph.com/docs/assemblyscript-api#api-reference):
  let owners = luw.owners;
  owners.push(event.params.owner);
  luw.owners = owners;

  luw.updatedAt = eventUTCMillis(event);
  luw.save();
}
