import {
  Address,
  BigInt,
  ethereum,
  log,
  ValueKind,
} from '@graphprotocol/graph-ts'

export let ZERO_ADDRESS = Address.fromString(
  "0x0000000000000000000000000000000000000000"
);

export function eventUTCMillis(event: ethereum.Event): BigInt {
  return event.block.timestamp.times(BigInt.fromI32(1000));
}

export function ethereumValueToString(v: ethereum.Value): string {
  let valueStr: string;
  switch (v.kind) {
    case ethereum.ValueKind.STRING:
      valueStr = v.toString();
      break;
    case ethereum.ValueKind.ADDRESS:
      valueStr = v.toAddress().toHexString();
      break;
    case ethereum.ValueKind.INT:
    case ethereum.ValueKind.UINT:
      valueStr = v.toBigInt().toString();
      break;
    case ethereum.ValueKind.BYTES:
    case ethereum.ValueKind.FIXED_BYTES:
      valueStr = v.toBytes().toHexString();
      break;
    case ethereum.ValueKind.TUPLE:
      valueStr =
        "(" +
        v
          .toTuple()
          .map<string>((iv: ethereum.Value) => ethereumValueToString(iv))
          .toString() +
        ")";
      break;
    default:
      // raw u64 type
      valueStr = v.data.toString();
  }
  return valueStr;
}

export function logInvocation(
  handlerName: string,
  event: ethereum.Event
): void {
  let paramLog: string[] = event.parameters.map<string>(
    (p) => p.name + ":" + ethereumValueToString(p.value)
  );
  log.info("{} [tx: {}] [params: {}]", [
    handlerName,
    event.transaction.hash.toHexString(),
    paramLog.toString(),
  ]);
}
