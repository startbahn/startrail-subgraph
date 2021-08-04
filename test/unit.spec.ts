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

// ignoring createdAt and updatedAt since it's timestamp
test("srrs", async () => {
  const query = `
  {
    srrs {
      id
      tokenId
      isPrimaryIssuer
      artistAddress
      issuer {
        id
      }
      ownerAddress
      metadataDigest
      transferCommitment
      provenance {
        id
      }
      metadataHistory {
        id
      }
      history {
        id
      }
      originChain
      originTxHash
    }
  }
`
  const result = await client.query(query)

  const data = [
    expect.objectContaining({
      artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
      history: [],
      id: "10255373",
      isPrimaryIssuer: false,
      issuer: {
        id: "0x0324fe78b2068036513b3618e1436d64ca64e136"
      },
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
      metadataHistory: [
        {
          id:
            "0x9c58c6bd0d771821795389c8f5f0e36ec83f816c43935c33a835a51c509ea21f"
        }
      ],
      originChain: "eip155:31337",
      originTxHash:
        "0x848b92ee142f7fe62d5c3f11132830ce6c0f0f8ac438842f3b3224de10c8e184",
      ownerAddress: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f",
      tokenId: "10255373",
      transferCommitment: null
    }),
    expect.objectContaining({
      artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
      history: [
        {
          id:
            "0xe816ba014d36a530fa00332e555613d1678221f17419b1bc9216e9af7ed98578"
        }
      ],
      id: "43593516",
      isPrimaryIssuer: false,
      issuer: {
        id: "0x0324fe78b2068036513b3618e1436d64ca64e136"
      },
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      metadataHistory: [
        {
          id:
            "0x1b5e7e25773284f3c86045f60c0de7bc84677d276da21fa5753a5c21c41d1d38"
        }
      ],
      originChain: "eip155:31337",
      originTxHash:
        "0xe2bac7d9ffa534b02b3581813faa6e7c3108bb56c51978935bfc5b68088dda60",
      ownerAddress: "0xb31f2241cb4d48dcf7825a75b46b4f6b13829a20",
      tokenId: "43593516",
      transferCommitment: null
    }),
    expect.objectContaining({
      artistAddress: "0x8be37f7589943efb19c0484ca00748dcd6a3cf1a",
      history: [],
      id: "80626184",
      isPrimaryIssuer: true,
      issuer: {
        id: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170"
      },
      metadataDigest:
        "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
      metadataHistory: [
        {
          id:
            "0xa9d166e3c5bf32432832205fef068c3b797fd91ae75600d61db63467b42fd7ac"
        }
      ],
      originChain: "eip155:31337",
      originTxHash:
        "0x9a6cd7a5c3495b37613418d7c62ff01637e683a7077a19a7c3d34633b044e189",
      ownerAddress: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170",
      tokenId: "80626184",
      transferCommitment: null
    })
  ]

  expect(result.srrs).toEqual(data)

  const ids = result.srrs
    .flatMap((x: any) => x.provenance)
    .map((x: any) => x.id)

  for (const id of ids) {
    expect(id).toHaveLength(66)
  }
})

// ignoring createdAt and updatedAt field since it's timestamp
test("licensedUserWallets ", async () => {
  const query = `
  {
    licensedUserWallets(orderBy: id) {
      id
      walletAddress
      threshold
      englishName
      originalName
      userType
      owners
      salt
      issuedSRRs {
        id
        tokenId
        isPrimaryIssuer
        artistAddress
        issuer {
          id
        }
        ownerAddress
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
      englishName: "New English Name",
      id: "0x0324fe78b2068036513b3618e1436d64ca64e136",
      issuedSRRs: [
        {
          artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
          id: "10255373",
          isPrimaryIssuer: false,
          issuer: {
            id: "0x0324fe78b2068036513b3618e1436d64ca64e136"
          },
          metadataDigest:
            "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
          ownerAddress: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f",
          tokenId: "10255373",
          transferCommitment: null
        },
        {
          artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
          id: "43593516",
          isPrimaryIssuer: false,
          issuer: {
            id: "0x0324fe78b2068036513b3618e1436d64ca64e136"
          },
          metadataDigest:
            "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
          ownerAddress: "0xb31f2241cb4d48dcf7825a75b46b4f6b13829a20",
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
      userType: "handler",
      walletAddress: "0x0324fe78b2068036513b3618e1436d64ca64e136"
    },
    {
      englishName: "Artist English",
      id: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170",
      issuedSRRs: [
        {
          artistAddress: "0x8be37f7589943efb19c0484ca00748dcd6a3cf1a",
          id: "80626184",
          isPrimaryIssuer: true,
          issuer: {
            id: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170"
          },
          metadataDigest:
            "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
          ownerAddress: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170",
          tokenId: "80626184",
          transferCommitment: null
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
      userType: "artist",
      walletAddress: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170"
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

// ignoring createdAt and updatedAt fields since it's timestamp
test("srrmetadataHistories", async () => {
  const query = `
  {
    srrmetadataHistories(orderBy: id) {
      id
      srr {
        id
        tokenId
        isPrimaryIssuer
        artistAddress
        ownerAddress
        metadataDigest
        transferCommitment
        metadataHistory {
          id
          srr {
            id
            isPrimaryIssuer
            artistAddress
            metadataDigest
          }
          metadataDigest
        }
        originChain
        originTxHash
      }
      metadataDigest
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      id: "0x1b5e7e25773284f3c86045f60c0de7bc84677d276da21fa5753a5c21c41d1d38",
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      srr: {
        artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
        id: "43593516",
        isPrimaryIssuer: false,
        metadataDigest:
          "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
        metadataHistory: [
          {
            id:
              "0x1b5e7e25773284f3c86045f60c0de7bc84677d276da21fa5753a5c21c41d1d38",
            metadataDigest:
              "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
            srr: {
              artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
              id: "43593516",
              isPrimaryIssuer: false,
              metadataDigest:
                "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251"
            }
          }
        ],
        originChain: "eip155:31337",
        originTxHash:
          "0xe2bac7d9ffa534b02b3581813faa6e7c3108bb56c51978935bfc5b68088dda60",
        ownerAddress: "0xb31f2241cb4d48dcf7825a75b46b4f6b13829a20",
        tokenId: "43593516",
        transferCommitment: null
      }
    },
    {
      id: "0x9c58c6bd0d771821795389c8f5f0e36ec83f816c43935c33a835a51c509ea21f",
      metadataDigest:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
      srr: {
        artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
        id: "10255373",
        isPrimaryIssuer: false,
        metadataDigest:
          "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
        metadataHistory: [
          {
            id:
              "0x9c58c6bd0d771821795389c8f5f0e36ec83f816c43935c33a835a51c509ea21f",
            metadataDigest:
              "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252",
            srr: {
              artistAddress: "0xa6e6a9e20a541680a1d6e1412f5088aefbf58a22",
              id: "10255373",
              isPrimaryIssuer: false,
              metadataDigest:
                "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727252"
            }
          }
        ],
        originChain: "eip155:31337",
        originTxHash:
          "0x848b92ee142f7fe62d5c3f11132830ce6c0f0f8ac438842f3b3224de10c8e184",
        ownerAddress: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f",
        tokenId: "10255373",
        transferCommitment: null
      }
    },
    {
      id: "0xa9d166e3c5bf32432832205fef068c3b797fd91ae75600d61db63467b42fd7ac",
      metadataDigest:
        "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
      srr: {
        artistAddress: "0x8be37f7589943efb19c0484ca00748dcd6a3cf1a",
        id: "80626184",
        isPrimaryIssuer: true,
        metadataDigest:
          "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
        metadataHistory: [
          {
            id:
              "0xa9d166e3c5bf32432832205fef068c3b797fd91ae75600d61db63467b42fd7ac",
            metadataDigest:
              "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
            srr: {
              artistAddress: "0x8be37f7589943efb19c0484ca00748dcd6a3cf1a",
              id: "80626184",
              isPrimaryIssuer: true,
              metadataDigest:
                "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64"
            }
          }
        ],
        originChain: "eip155:31337",
        originTxHash:
          "0x9a6cd7a5c3495b37613418d7c62ff01637e683a7077a19a7c3d34633b044e189",
        ownerAddress: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170",
        tokenId: "80626184",
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

  const data = [
    {
      id: "0x29ceb9c066b39b6a785995241185df9ec02f056a91ebfff158abd83c3fce7018"
    },
    {
      id: "0x4514c3f9a7a0c4c7b644262bbfd284569b6d470d02d5dec89c443ddeb66f3f45"
    },
    {
      id: "0x471acc504acb4f53ba77761d8375d0561975ddbfeb23636e4c9d30c2af8eba2a"
    },
    {
      id: "0x7581cb842e565b3e27a43a7ff9ff28f8876c50938e93ef45c9ac972d7ed9be30"
    },
    {
      id: "0xc695a64693cf85d2d2b0166e14561e5d68778d55fa66ee5c3b41426b28362b52"
    },
    {
      id: "0xcbbfb106bc1c9680e57ca68be46ed2afd7833383bc951978df2d5aedbf4767ac"
    },
    {
      id: "0xdd485a8f6167a1598efc2019c3c79adf83b73b4292b078c6885bb843fde167ae"
    },
    {
      id: "0xe5ccfd266b6b47420abdbf4d6f60a9e48187f04813a9c43e89d82e01d59e3235"
    },
    {
      id: "0xe675ecbcbed8315e222b19e49c406b9027811cfdc2066a4a28018ede5e547870"
    },
    {
      id: "0xf5bdbadc379a8d91a1bc4545f728ef8b5b54414bc9fb80f2e84304e60e14672a"
    }
  ]

  expect(result.metaTxExecutions).toStrictEqual(data)
})

// ignoring createdAt and timestamp field since it's timestamp
test("srrprovenances", async () => {
  const query = `
  {
    srrprovenances {
      id
      srr {
        id
      }
      from
      to
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

  const data = expect.arrayContaining([
    expect.objectContaining({
      customHistory: null,
      from: "0x0324fe78b2068036513b3618e1436d64ca64e136",
      isIntermediary: false,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "43593516"
      },
      to: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f"
    }),
    expect.objectContaining({
      customHistory: null,
      from: "0x0324fe78b2068036513b3618e1436d64ca64e136",
      isIntermediary: true,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "10255373"
      },
      to: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f"
    }),
    expect.objectContaining({
      customHistory: null,
      from: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f",
      isIntermediary: false,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "43593516"
      },
      to: "0xb31f2241cb4d48dcf7825a75b46b4f6b13829a20"
    })
  ])

  expect(result.srrprovenances).toEqual(data)

  const ids = result.srrprovenances.map((x: any) => x.id)
  for (const id of ids) {
    expect(id).toHaveLength(66)
  }
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
      issuer
      tokenId
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      id: "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      issuer: "0x0324fe78b2068036513b3618e1436d64ca64e136",
      merkleRoot:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      srrs: [],
      tokenId: null
    }
  ]

  expect(result.bulkIssues).toStrictEqual(data)
})

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
      originTxHash
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
      originTxHash:
        "0x8458b24d24765dd041fd522ce99f7a8cec7ba0dbc1185183ec8fbcc6df85015f",
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
