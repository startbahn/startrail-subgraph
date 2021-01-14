import { Bytes, log } from '@graphprotocol/graph-ts'

import {
  CreateLicensedUserWallet as CreateLUWEvent,
  MultiSigOwnerAddition as MultiSigOwnerAdditionEvent,
} from '../generated/LicensedUserEvent/LicensedUserEvent'
import { LicensedUserWallet } from '../generated/schema'
import { eventUTCMillis } from './utils'

export function userType(n: i32): string {
  switch (n) {
    case 0:
      return "admin";
    case 1:
      return "handler";
    case 2:
      return "artist";
    default:
      log.error(`unhandled userType: {}`, [n.toString()]);
      return "";
  }
}
export function handleCreateLicensedUserWallet(event: CreateLUWEvent): void {
  let luwId = event.params.contractAddress.toHexString();

  let luw = new LicensedUserWallet(luwId);
  luw.contractAddress = event.params.contractAddress;
  luw.requiredConfirmation = event.params.requiredConfirmation.toI32();
  luw.englishName = event.params.englishName;
  luw.originalName = event.params.originalName;
  luw.owners = event.params.owners as Array<Bytes>;
  luw.userType = userType(event.params.userType);
  luw.createdAt = luw.updatedAt = eventUTCMillis(event);

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
