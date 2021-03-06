import { log, store } from '@graphprotocol/graph-ts'

import {
  ExecutionSuccess as ExecutionSuccessEvent,
  RequestTypeRegistered as RequestTypeRegisteredEvent,
  RequestTypeUnregistered as RequestTypeUnregisteredEvent,
} from '../generated/MetaTxForwarder/MetaTxForwarder'
import { MetaTxExecution, MetaTxRequestType } from '../generated/schema'
import { eventUTCMillis, logInvocation } from './utils'

export function handleRequestTypeRegistered(
  event: RequestTypeRegisteredEvent
): void {
  logInvocation("handleRequestTypeRegistered", event);

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
  logInvocation("handleRequestTypeUnregistered", event);

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
  logInvocation("handleExecutionSuccess", event);

  let txHash = event.params.txHash;
  let execution = new MetaTxExecution(txHash.toHexString());
  execution.txHash = txHash;
  log.info("creating MetaTxExecution hash [{}]", [txHash.toHexString()]);
  execution.createdAt = eventUTCMillis(event);
  execution.save();
}
