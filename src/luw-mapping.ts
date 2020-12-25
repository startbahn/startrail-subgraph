import { Bytes, log } from '@graphprotocol/graph-ts'

import { CreateLicensedUserWallet as LegacyCreateLUWEvent } from '../generated/LicensedUserEvent/LicensedUserEvent'
import {
  CreateLicensedUserWalletMulti as CreateLUWMultiEvent,
  CreateLicensedUserWalletSingle as CreateLUWSingleEvent,
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
  let luwId = event.params.walletAddress.toHexString();

  let luw = new LicensedUserWallet(luwId);
  luw.walletAddress = event.params.walletAddress;
  luw.englishName = event.params.englishName;
  luw.originalName = event.params.originalName;
  luw.owners = [event.params.owner];
  luw.userType = userType(event.params.userType);
  luw.createdAt = luw.updatedAt = eventUTCMillis(event);

  luw.save();
}

export function handleCreateLicensedUserWalletMulti(
  event: CreateLUWMultiEvent
): void {
  let luwId = event.params.walletAddress.toHexString();

  let luw = new LicensedUserWallet(luwId);
  luw.walletAddress = event.params.walletAddress;
  luw.englishName = event.params.englishName;
  luw.originalName = event.params.originalName;
  luw.owners = event.params.owners;
  luw.threshold = event.params.threshold;
  luw.userType = userType(event.params.userType);
  luw.createdAt = luw.updatedAt = eventUTCMillis(event);

  luw.save();
}

export function legacyHandleCreateLicensedUserWallet(
  event: LegacyCreateLUWEvent
): void {
  let luwId = event.params.contractAddress.toHexString();

  let luw = new LicensedUserWallet(luwId);
  luw.walletAddress = event.params.contractAddress;
  luw.threshold = event.params.requiredConfirmation.toI32();
  luw.englishName = event.params.englishName;
  luw.originalName = event.params.originalName;
  luw.owners = event.params.owners as Array<Bytes>;
  luw.userType = legacyUserType(event.params.userType);
  luw.createdAt = luw.updatedAt = eventUTCMillis(event);

  luw.save();
}
