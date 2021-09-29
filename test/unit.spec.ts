const Lokka = require("lokka").Lokka
const Transport = require("lokka-transport-http").Transport

let client: any

beforeAll(() => {
  client = new Lokka({
    transport: new Transport(
      "http://127.0.0.1:8000/subgraphs/name/startbahn/startrail-local"
    )
  })
})

// ignoring createdAt and updatedAt since it's timestamp, and issuer, metadataHistory, provenance with id, originTxHash
test("srrs", async () => {
  const query = `
  {
    srrs {
      id
      tokenId
      metadataDigest
      transferCommitment
      history {
        id
      }
      originChain
    }
  }
`

  const query2 = `
  {
    srrs {
      provenance {
        id
      }
    }
  }
`

  const result = await client.query(query)
  const result2 = await client.query(query2)

  const data = [
    expect.objectContaining({
      history: [],
      id: "10255373",
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
      originChain: "eip155:31337",
      tokenId: "10255373",
      transferCommitment: null
    }),
    expect.objectContaining({
      history: [
        {
          id:
            "0xe816ba014d36a530fa00332e555613d1678221f17419b1bc9216e9af7ed98578"
        }
      ],
      id: "43593516",
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      originChain: "eip155:31337",
      tokenId: "43593516",
      transferCommitment: null
    }),
    expect.objectContaining({
      history: [],
      id: "80626184",
      metadataDigest:
        "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
      originChain: "eip155:31337",
      tokenId: "80626184",
      transferCommitment: null
    })
  ]

  expect(result.srrs).toEqual(data)

  const ids = result2.srrs
    .flatMap((x: any) => x.provenance)
    .map((x: any) => x.id)

  for (const id of ids) {
    expect(id).toHaveLength(66)
  }
})

// ignoring walletAddress, createdAt, updatedAt, and  field since it's timestamp
test("licensedUserWallets ", async () => {
  const query = `
  {
    licensedUserWallets {
      threshold
      englishName
      originalName
      userType
      owners
      salt
      issuedSRRs {
        id
        tokenId
        metadataDigest
        transferCommitment
      }
      originChain
    }
  }
  `
  const result = await client.query(query)

  const data = [
    {
      englishName: "Artist English",
      issuedSRRs: [
        {
          id: "80626184",
          metadataDigest: "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
          tokenId: "80626184",
          transferCommitment: null,
        }
      ],
      originChain: null,
      originalName: "Artist Original",
      owners: [
        "0x853f2251666f9d8c45cc760ae10ab0278533d28c",
        "0x171ea52e619b7fdde870b328ccfb70217a3e32ae",
        "0xad87f0b51a8788192edd0640ab5ed58e48145c82"
      ],
      salt:
        "0x64e604787cbf194841e7b68d7cd28786f6c9a0a3ab9f8b0a0e87cb4387ab0001",
      threshold: 1,
      userType: "artist"
    },
    {
      englishName: "New English Name",
      issuedSRRs: [
        {
          id: "10255373",
          metadataDigest:
            "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
          tokenId: "10255373",
          transferCommitment: null
        },
        {
          id: "43593516",
          metadataDigest:
            "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
          tokenId: "43593516",
          transferCommitment: null
        }
      ],
      originChain: null,
      originalName: "New Original Name",
      owners: [
        "0x853f2251666f9d8c45cc760ae10ab0278533d28c",
        "0x171ea52e619b7fdde870b328ccfb70217a3e32ae",
        "0xad87f0b51a8788192edd0640ab5ed58e48145c82"
      ],
      salt:
        "0x64e604787cbf194841e7b68d7cd28786f6c9a0a3ab9f8b0a0e87cb4387ab0002",
      threshold: 1,
      userType: "handler"
    }
  ]
  expect(result.licensedUserWallets).toStrictEqual(data)
})

// ignoring createdAt field since it's timestamp
test("customHistoryType", async () => {
  const query = `
  {
    customHistoryTypes {
      id
      name
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      id: "1",
      name: "auction"
    },
    {
      id: "2",
      name: "exhibition"
    }
  ]
  expect(result.customHistoryTypes).toStrictEqual(data)
})

// ignoring id, createdAt and updatedAt fields since it's timestamp, originTxHash
test("srrmetadataHistories", async () => {
  const query = `
  {
    srrmetadataHistories(orderBy: createdAt, orderDirection: desc) {
      srr {
        metadataDigest
        transferCommitment
        metadataHistory {
          srr {
            metadataDigest
          }
          metadataDigest
        }
        originChain
      }
      metadataDigest
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
      srr: {
        metadataDigest:
          "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
        metadataHistory: [
          {
            metadataDigest:
              "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
            srr: {
              metadataDigest:
                "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252"
            }
          }
        ],
        originChain: "eip155:31337",
        transferCommitment: null
      }
    },
    {
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      srr: {
        metadataDigest:
          "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
        metadataHistory: [
          {
            metadataDigest:
              "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
            srr: {
              metadataDigest:
                "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251"
            }
          }
        ],
        originChain: "eip155:31337",
        transferCommitment: null
      }
    },
    {
      metadataDigest:
        "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
      srr: {
        metadataDigest:
          "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
        metadataHistory: [
          {
            metadataDigest:
              "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
            srr: {
              metadataDigest:
                "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64"
            }
          }
        ],
        originChain: "eip155:31337",
        transferCommitment: null
      }
    }
  ]
  expect(result.srrmetadataHistories).toStrictEqual(data)
})

// ignoring createdAt field since it's timestamp
test("metaTxRequestTypes", async () => {
  const query = `
  {
    metaTxRequestTypes {
      id
      typeHash
      typeString
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      id: "0x052d8d1acdbf73c1b466436c3bc062709a28af704363f8b326314d7ab01ce47b",
      typeHash:
        "0x052d8d1acdbf73c1b466436c3bc062709a28af704363f8b326314d7ab01ce47b",
      typeString:
        "BulkTransferSendBatch(address from,uint256 nonce,bytes32 merkleRoot)"
    },
    {
      id: "0x1f6bcc34496ca1b52d584f9a76e6a39b27989a9c186f8bcac08b53d1b03bb293",
      typeHash:
        "0x1f6bcc34496ca1b52d584f9a76e6a39b27989a9c186f8bcac08b53d1b03bb293",
      typeString:
        "StartrailRegistryAddHistory(address from,uint256 nonce,bytes data,uint256[] tokenIds,uint256[] customHistoryIds)"
    },
    {
      id: "0x425002ddfe8a5210fcf678ff38ca336c9b3babbf2f10efa5fdeaace5951e2b48",
      typeHash:
        "0x425002ddfe8a5210fcf678ff38ca336c9b3babbf2f10efa5fdeaace5951e2b48",
      typeString:
        "WalletSetOriginalName(address from,uint256 nonce,bytes data,address wallet,string name)"
    },
    {
      id: "0x72aa5b313beffb167251bd88ac4c617700ece940a29fc55df7dea54d0e47f5c6",
      typeHash:
        "0x72aa5b313beffb167251bd88ac4c617700ece940a29fc55df7dea54d0e47f5c6",
      typeString:
        "WalletSetEnglishName(address from,uint256 nonce,bytes data,address wallet,string name)"
    },
    {
      id: "0x9eb400930ea9ba11485a1fbe22ec6b4f1f4b74ec9c1f867ed95185ef2f67092c",
      typeHash:
        "0x9eb400930ea9ba11485a1fbe22ec6b4f1f4b74ec9c1f867ed95185ef2f67092c",
      typeString:
        "WalletRemoveOwner(address from,uint256 nonce,address wallet,address prevOwner,address owner,uint256 threshold)"
    },
    {
      id: "0xa2c5a6fe8768fd09231270ba9fee50bd8355a89a393cedf6d8171fe3a7fa075c",
      typeHash:
        "0xa2c5a6fe8768fd09231270ba9fee50bd8355a89a393cedf6d8171fe3a7fa075c",
      typeString:
        "BulkIssueSendBatch(address from,uint256 nonce,bytes32 merkleRoot)"
    },
    {
      id: "0xa32f0c35f201b6260c799d8f4f0c66d8d05a3e60db8cdeb795ab26987366a155",
      typeHash:
        "0xa32f0c35f201b6260c799d8f4f0c66d8d05a3e60db8cdeb795ab26987366a155",
      typeString:
        "WalletSwapOwner(address from,uint256 nonce,address wallet,address prevOwner,address oldOwner,address newOwner)"
    },
    {
      id: "0xa51d034042007707c0d3a28048543b905e0c5b8646875ced2aa5f128895ee1fb",
      typeHash:
        "0xa51d034042007707c0d3a28048543b905e0c5b8646875ced2aa5f128895ee1fb",
      typeString:
        "StartrailRegistryCreateSRR(address from,uint256 nonce,bool isPrimaryIssuer,address artistAddress,bytes32 metadataDigest)"
    },
    {
      id: "0xb4d22bf06a762d0a27f1c25c8a258e0982dbc92abe4d6d72fdbec60d49464daa",
      typeHash:
        "0xb4d22bf06a762d0a27f1c25c8a258e0982dbc92abe4d6d72fdbec60d49464daa",
      typeString:
        "StartrailRegistryApproveSRRByCommitment(address from,uint256 nonce,bytes data,uint256 tokenId,bytes32 commitment,string historyMetadataDigest)"
    },
    {
      id: "0xd111846f191cf3c32ce6aedccf704a641a50381f22729d5a6cd5f13a0554ef80",
      typeHash:
        "0xd111846f191cf3c32ce6aedccf704a641a50381f22729d5a6cd5f13a0554ef80",
      typeString:
        "StartrailRegistryUpdateSRRMetadata(address from,uint256 nonce,uint256 tokenId,bytes32 metadataDigest)"
    },
    {
      id: "0xe40b02b26d5443f4479036538f991a995624f5cc199ecab72a0dde126115a16c",
      typeHash:
        "0xe40b02b26d5443f4479036538f991a995624f5cc199ecab72a0dde126115a16c",
      typeString:
        "WalletAddOwner(address from,uint256 nonce,address wallet,address owner,uint256 threshold)"
    },
    {
      id: "0xebdf6224c1bb9fe61ea31b37d9b143c5b2c3b390aa1970cd68f6e4cdcb087e06",
      typeHash:
        "0xebdf6224c1bb9fe61ea31b37d9b143c5b2c3b390aa1970cd68f6e4cdcb087e06",
      typeString:
        "StartrailRegistryApproveSRRByCommitmentWithCustomHistoryId(address from,uint256 nonce,bytes data,uint256 tokenId,bytes32 commitment,string historyMetadataDigest,uint256 customHistoryId)"
    },
    {
      id: "0xf6f490ad3237fb8a6611e8cb20e7dc248e4df8fb091d3ebebfb536dc98e54397",
      typeHash:
        "0xf6f490ad3237fb8a6611e8cb20e7dc248e4df8fb091d3ebebfb536dc98e54397",
      typeString:
        "StartrailRegistryUpdateSRR(address from,uint256 nonce,uint256 tokenId,bool isPrimaryIssuer,address artistAddress)"
    },
    {
      id: "0xfc61e554d8da03571436be8820948b7c044eb5abfddb2394091c1fdebc71b5fd",
      typeHash:
        "0xfc61e554d8da03571436be8820948b7c044eb5abfddb2394091c1fdebc71b5fd",
      typeString:
        "StartrailRegistryCancelSRRCommitment(address from,uint256 nonce,uint256 tokenId)"
    },
    {
      id: "0xff1b6ae7ba3b6fcaf8441b4b7ebbebb22444db035e8eb25feb17296a6c00b54b",
      typeHash:
        "0xff1b6ae7ba3b6fcaf8441b4b7ebbebb22444db035e8eb25feb17296a6c00b54b",
      typeString:
        "WalletChangeThreshold(address from,uint256 nonce,address wallet,uint256 threshold)"
    }
    // for decentalized storage
    // {
    //   id: "0xa5772716d883ea9d1e653c127fc4b5f193148ae32c6699efdcdba6fa2a242f4f",
    //   typeHash: 
    //     "0xa5772716d883ea9d1e653c127fc4b5f193148ae32c6699efdcdba6fa2a242f4f",
    //   typeString: 
    //     "StartrailRegistryUpdateSRRMetadataV2(address from,uint256 nonce,bytes data,uint256 tokenId,string metadataDigest)",
    // },
    // {
    //   id: "0xe0ff2c72dcc273eb61555bd35aa1b25a97a14163d68e843f798a5763111780be",
    //   typeHash: 
    //     "0xe0ff2c72dcc273eb61555bd35aa1b25a97a14163d68e843f798a5763111780be",
    //   typeString: 
    //     "StartrailRegistryCreateSRRV2(address from,uint256 nonce,bytes data,bool isPrimaryIssuer,address artistAddress,string metadataDigest)",
    // },
  ]
  expect(result.metaTxRequestTypes).toStrictEqual(data)
})

// ignoring createdAt field since it's timestamp, and txHash since it's same as
test("metaTxExecutions", async () => {
  const query = `
  {
    metaTxExecutions(orderBy: id) {
      id
    }
  }
`
  const result = await client.query(query)

  const ids = result.metaTxExecutions.map((x: any) => x.id)
  for (const id of ids) {
    expect(id).toHaveLength(66)
  }
})

// ignoring createdAt, id, from, to, and timestamp field
test("srrprovenances", async () => {
  const query = `
  {
    srrprovenances(orderBy:createdAt, orderDirection:asc) {
      srr {
        id
      }
      metadataDigest
      metadataURI
      customHistory {
        id
      }
      isIntermediary
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      customHistory: null,
      isIntermediary: false,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "43593516"
      }
    },
    {
      customHistory: null,
      isIntermediary: true,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "10255373"
      }
    },
    {
      customHistory: null,
      isIntermediary: false,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "43593516"
      }
    },
    {
      customHistory: null,
      isIntermediary: false,
      metadataDigest: "0x",
      metadataURI: "",
      srr: {
        id: "10255373",
      },
    }
  ]

  expect(result.srrprovenances).toEqual(data)
})

// ignoring createdAt field since it's timestamp
test("srrtransferCommits", async () => {
  const query = `
  {
    srrtransferCommits {
      id
      commitment
      lastAction
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      commitment: null,
      id: "10255373",
      lastAction: "transfer"
    },
    {
      commitment: null,
      id: "43593516",
      lastAction: "transfer"
    }
  ]

  expect(result.srrtransferCommits).toStrictEqual(data)
})

// ignoring createdAt and updatedAt field
test("bulkIssues", async () => {
  const query = `
  {
    bulkIssues {
      id
      merkleRoot
      srrs
      tokenId
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      id: "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      merkleRoot:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      srrs: [],
      tokenId: null
    }
  ]

  expect(result.bulkIssues).toStrictEqual(data)
})

//ignore originTxHash
test("customHistories", async () => {
  const query = `
  {
    customHistories {
      id
      historyType {
        id
        name
      }
      name
      metadataDigest
      srrHistory {
        id
      }
      originChain
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      historyType: {
        id: "2",
        name: "exhibition"
      },
      id: "1",
      metadataDigest:
        "0xcc3b6344b207c582bd727005be2a5de5bbca7b46b590d9e9189f3a9a7ea8283e",
      name: "GOMA Australia",
      originChain: "eip155:31337",
      srrHistory: [
        {
          id:
            "0xe816ba014d36a530fa00332e555613d1678221f17419b1bc9216e9af7ed98578"
        }
      ]
    }
  ]

  expect(result.customHistories).toStrictEqual(data)
})

// ignoring createdAt field since it's timestamp
test("srrHistories", async () => {
  const query = `
  {
    srrhistories {
      id
      srr {
        id
      }
      customHistory {
        id
      }
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      customHistory: {
        id: "1"
      },
      id: "0xe816ba014d36a530fa00332e555613d1678221f17419b1bc9216e9af7ed98578",
      srr: {
        id: "43593516"
      }
    }
  ]

  expect(result.srrhistories).toStrictEqual(data)
})
