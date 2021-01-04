import { BigInt, Bytes, log } from '@graphprotocol/graph-ts'

import { CreateLicensedUserWallet as LegacyCreateLUWEvent } from '../generated/LicensedUserEvent/LicensedUserEvent'
import {
  CreateLicensedUserWalletMulti as CreateLUWMultiEvent,
  CreateLicensedUserWalletSingle as CreateLUWSingleEvent,
  UpdateEnglishName as UpdateEnglishNameEvent,
  UpdateOriginalName as UpdateOriginalNameEvent,
  UpgradeLicensedUserWalletToMulti as UpgradeLicensedUserWalletToMultiEvent,
} from '../generated/LicensedUserManager/LicensedUserManager'
import { LicensedUserWallet } from '../generated/schema'
import { eventUTCMillis } from './utils'

export function userType(n: i32): string {
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

export function legacyUserType(n: i32): string {
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

export function handleCreateLicensedUserWalletSingle(
  event: CreateLUWSingleEvent
): void {
  let timestampMillis = eventUTCMillis(event);
  let luwId = event.params.walletAddress.toHexString();
  let luw = LicensedUserWallet.load(luwId);

  // New wallet (not a migration from legacy)
  // If it's a migration we skip setting these values as they are already set
  if (luw == null) {
    log.info("creating new single LUW {}", [luwId]);
    luw = new LicensedUserWallet(luwId);
    luw.walletAddress = event.params.walletAddress;
    luw.englishName = event.params.englishName;
    luw.originalName = event.params.originalName;
    luw.owners = [event.params.owner];
    luw.threshold = BigInt.fromI32(1);
    luw.createdAt = timestampMillis;
  } else {
    log.info("migrating legacy single LUW {}", [luwId]);
  }

  luw.userType = userType(event.params.userType);
  luw.updatedAt = timestampMillis;

  luw.save();
}

export function handleCreateLicensedUserWalletMulti(
  event: CreateLUWMultiEvent
): void {
  let timestampMillis = eventUTCMillis(event);
  let luwId = event.params.walletAddress.toHexString();
  let luw = LicensedUserWallet.load(luwId);

  // New wallet (not a migration from legacy)
  // If it's a migration we skip setting these values as they are already set
  if (luw == null) {
    log.info("creating new multi LUW {}", [luwId]);
    luw = new LicensedUserWallet(luwId);
    luw.walletAddress = event.params.walletAddress;
    luw.englishName = event.params.englishName;
    luw.originalName = event.params.originalName;
    luw.owners = event.params.owners as Array<Bytes>;
    luw.threshold = event.params.threshold;
    luw.createdAt = timestampMillis;
  } else {
    log.info("migrating legacy multi LUW {}", [luwId]);
  }

  luw.userType = userType(event.params.userType);
  luw.updatedAt = timestampMillis;

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
