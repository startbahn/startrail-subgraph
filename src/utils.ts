import { ByteArray, ethereum } from '@graphprotocol/graph-ts'

// Helper for concatenating two byte arrays
// from the ens-subgraph:
export function concat(a: ByteArray, b: ByteArray): ByteArray {
  let out = new Uint8Array(a.length + b.length)
  for (let i = 0; i < a.length; i++) {
    out[i] = a[i]
  }
  for (let j = 0; j < b.length; j++) {
    out[a.length + j] = b[j]
  }
  return out as ByteArray
}

// from the ens-subgraph:
export function byteArrayFromHex(s: string): ByteArray {
  if(s.length % 2 !== 0) {
    throw new TypeError("Hex string must have an even number of characters")
  }
  let out = new Uint8Array(s.length / 2)
  for(var i = 0; i < s.length; i += 2) {
    out[i / 2] = parseInt(s.substring(i, i + 2), 16) as u32
  }
  return out as ByteArray;
}

export function eventUTCMillis(event: ethereum.Event): i32 {
  return event.block.timestamp.toI32() * 1000
}

