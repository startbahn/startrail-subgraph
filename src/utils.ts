import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'

export function eventUTCMillis(event: ethereum.Event): BigInt {
  return event.block.timestamp.times(BigInt.fromI32(1000))
}

export let ZERO_ADDRESS = 
  Address.fromString('0x0000000000000000000000000000000000000000')