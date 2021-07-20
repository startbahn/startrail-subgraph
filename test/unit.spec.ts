const Lokka = require("lokka").Lokka
const Transport = require("lokka-transport-http").Transport

const query = `
  {
    srrs {
      isPrimaryIssuer
      artistAddress
      metadataDigest
    }
  }
`

test("data indexed by meta-tx-sr-issue2.json", async () => {
  const client = new Lokka({
    transport: new Transport(
      "http://127.0.0.1:8000/subgraphs/name/startbahn/startrail-local"
    )
  })
  const result = await client.query(query)

  const data = {
    isPrimaryIssuer: true,
    artistAddress: "0x8Be37f7589943eFb19c0484ca00748DCD6A3cf1a".toLowerCase(),
    metadataDigest:
      "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64"
  }
  expect(result.srrs[0]).toStrictEqual(data)
})
