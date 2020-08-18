import { BigInt, ethereum } from '@graphprotocol/graph-ts'

export function eventUTCMillis(event: ethereum.Event): BigInt {
  return event.block.timestamp.times(BigInt.fromI32(1000))
}

