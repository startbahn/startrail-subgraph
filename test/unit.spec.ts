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

test("srrs", async () => {
  const query = `
  {
    srrs {
      isPrimaryIssuer
      artistAddress
      metadataDigest
    }
  }
`
  const result = await client.query(query)

  const data = {
    isPrimaryIssuer: true,
    artistAddress: "0x8Be37f7589943eFb19c0484ca00748DCD6A3cf1a".toLowerCase(),
    metadataDigest:
      "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64"
  }
  expect(result.srrs[0]).toStrictEqual(data)
})

test("licensedUserWallets ", async () => {
  const query = `
  {
    licensedUserWallets {
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
      createdAt
      updatedAt
    }
  }
  `
  const result = await client.query(query)

  const data = {
    createdAt: "1626785848000",
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
    salt: "0x64e604787cbf194841e7b68d7cd28786f6c9a0a3ab9f8b0a0e87cb4387ab0001",
    threshold: 1,
    updatedAt: "1626785848000",
    userType: "artist",
    walletAddress: "0x8b3975ea1fabd1fe60f45a5768a0ee4c4d24c170"
  }
  expect(result.licensedUserWallets[0]).toStrictEqual(data)
})

test("customHistoryType", async () => {
  const query = `
  {
    customHistoryTypes {
      id
      name
      createdAt
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      createdAt: "1626785819000",
      id: "1",
      name: "auction"
    },
    {
      createdAt: "1626785820000",
      id: "2",
      name: "exhibition"
    }
  ]
  expect(result.customHistoryTypes).toStrictEqual(data)
})

test("srrmetadataHistories", async () => {
  const query = `
  {
    srrmetadataHistories {
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
          createdAt
        }
        originChain
        originTxHash
        createdAt
        updatedAt
      }
      metadataDigest
      createdAt
    }
  }
`
  const result = await client.query(query)

  const data = {
    createdAt: "1626785849000",
    id: "0xa9d166e3c5bf32432832205fef068c3b797fd91ae75600d61db63467b42fd7ac",
    metadataDigest:
      "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
    srr: {
      artistAddress: "0x8be37f7589943efb19c0484ca00748dcd6a3cf1a",
      createdAt: "1626785849000",
      id: "80626184",
      isPrimaryIssuer: true,
      metadataDigest:
        "0x4c8f18581c0167eb90a761b4a304e009b924f03b619a0c0e8ea3adfce20aee64",
      metadataHistory: [
        {
          createdAt: "1626785849000",
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
      transferCommitment: null,
      updatedAt: "1626785849000"
    }
  }
  expect(result.srrmetadataHistories[0]).toStrictEqual(data)
})

test("metaTxRequestTypes", async () => {
  const query = `
  {
    metaTxRequestTypes {
      id
      typeHash
      typeString
      createdAt
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      createdAt: "1626785832000",
      id: "0x052d8d1acdbf73c1b466436c3bc062709a28af704363f8b326314d7ab01ce47b",
      typeHash:
        "0x052d8d1acdbf73c1b466436c3bc062709a28af704363f8b326314d7ab01ce47b",
      typeString:
        "BulkTransferSendBatch(address from,uint256 nonce,bytes32 merkleRoot)"
    },
    {
      createdAt: "1626785838000",
      id: "0x1f6bcc34496ca1b52d584f9a76e6a39b27989a9c186f8bcac08b53d1b03bb293",
      typeHash:
        "0x1f6bcc34496ca1b52d584f9a76e6a39b27989a9c186f8bcac08b53d1b03bb293",
      typeString:
        "StartrailRegistryAddHistory(address from,uint256 nonce,bytes data,uint256[] tokenIds,uint256[] customHistoryIds)"
    },
    {
      createdAt: "1626785824000",
      id: "0x425002ddfe8a5210fcf678ff38ca336c9b3babbf2f10efa5fdeaace5951e2b48",
      typeHash:
        "0x425002ddfe8a5210fcf678ff38ca336c9b3babbf2f10efa5fdeaace5951e2b48",
      typeString:
        "WalletSetOriginalName(address from,uint256 nonce,bytes data,address wallet,string name)"
    },
    {
      createdAt: "1626785824000",
      id: "0x72aa5b313beffb167251bd88ac4c617700ece940a29fc55df7dea54d0e47f5c6",
      typeHash:
        "0x72aa5b313beffb167251bd88ac4c617700ece940a29fc55df7dea54d0e47f5c6",
      typeString:
        "WalletSetEnglishName(address from,uint256 nonce,bytes data,address wallet,string name)"
    },
    {
      createdAt: "1626785824000",
      id: "0x9eb400930ea9ba11485a1fbe22ec6b4f1f4b74ec9c1f867ed95185ef2f67092c",
      typeHash:
        "0x9eb400930ea9ba11485a1fbe22ec6b4f1f4b74ec9c1f867ed95185ef2f67092c",
      typeString:
        "WalletRemoveOwner(address from,uint256 nonce,address wallet,address prevOwner,address owner,uint256 threshold)"
    },
    {
      createdAt: "1626785824000",
      id: "0xa2c5a6fe8768fd09231270ba9fee50bd8355a89a393cedf6d8171fe3a7fa075c",
      typeHash:
        "0xa2c5a6fe8768fd09231270ba9fee50bd8355a89a393cedf6d8171fe3a7fa075c",
      typeString:
        "BulkIssueSendBatch(address from,uint256 nonce,bytes32 merkleRoot)"
    },
    {
      createdAt: "1626785824000",
      id: "0xa32f0c35f201b6260c799d8f4f0c66d8d05a3e60db8cdeb795ab26987366a155",
      typeHash:
        "0xa32f0c35f201b6260c799d8f4f0c66d8d05a3e60db8cdeb795ab26987366a155",
      typeString:
        "WalletSwapOwner(address from,uint256 nonce,address wallet,address prevOwner,address oldOwner,address newOwner)"
    },
    {
      createdAt: "1626785824000",
      id: "0xa51d034042007707c0d3a28048543b905e0c5b8646875ced2aa5f128895ee1fb",
      typeHash:
        "0xa51d034042007707c0d3a28048543b905e0c5b8646875ced2aa5f128895ee1fb",
      typeString:
        "StartrailRegistryCreateSRR(address from,uint256 nonce,bool isPrimaryIssuer,address artistAddress,bytes32 metadataDigest)"
    },
    {
      createdAt: "1626785824000",
      id: "0xb4d22bf06a762d0a27f1c25c8a258e0982dbc92abe4d6d72fdbec60d49464daa",
      typeHash:
        "0xb4d22bf06a762d0a27f1c25c8a258e0982dbc92abe4d6d72fdbec60d49464daa",
      typeString:
        "StartrailRegistryApproveSRRByCommitment(address from,uint256 nonce,bytes data,uint256 tokenId,bytes32 commitment,string historyMetadataDigest)"
    },
    {
      createdAt: "1626785824000",
      id: "0xd111846f191cf3c32ce6aedccf704a641a50381f22729d5a6cd5f13a0554ef80",
      typeHash:
        "0xd111846f191cf3c32ce6aedccf704a641a50381f22729d5a6cd5f13a0554ef80",
      typeString:
        "StartrailRegistryUpdateSRRMetadata(address from,uint256 nonce,uint256 tokenId,bytes32 metadataDigest)"
    },
    {
      createdAt: "1626785824000",
      id: "0xe40b02b26d5443f4479036538f991a995624f5cc199ecab72a0dde126115a16c",
      typeHash:
        "0xe40b02b26d5443f4479036538f991a995624f5cc199ecab72a0dde126115a16c",
      typeString:
        "WalletAddOwner(address from,uint256 nonce,address wallet,address owner,uint256 threshold)"
    },
    {
      createdAt: "1626785824000",
      id: "0xebdf6224c1bb9fe61ea31b37d9b143c5b2c3b390aa1970cd68f6e4cdcb087e06",
      typeHash:
        "0xebdf6224c1bb9fe61ea31b37d9b143c5b2c3b390aa1970cd68f6e4cdcb087e06",
      typeString:
        "StartrailRegistryApproveSRRByCommitmentWithCustomHistoryId(address from,uint256 nonce,bytes data,uint256 tokenId,bytes32 commitment,string historyMetadataDigest,uint256 customHistoryId)"
    },
    {
      createdAt: "1626785824000",
      id: "0xf6f490ad3237fb8a6611e8cb20e7dc248e4df8fb091d3ebebfb536dc98e54397",
      typeHash:
        "0xf6f490ad3237fb8a6611e8cb20e7dc248e4df8fb091d3ebebfb536dc98e54397",
      typeString:
        "StartrailRegistryUpdateSRR(address from,uint256 nonce,uint256 tokenId,bool isPrimaryIssuer,address artistAddress)"
    },
    {
      createdAt: "1626785824000",
      id: "0xfc61e554d8da03571436be8820948b7c044eb5abfddb2394091c1fdebc71b5fd",
      typeHash:
        "0xfc61e554d8da03571436be8820948b7c044eb5abfddb2394091c1fdebc71b5fd",
      typeString:
        "StartrailRegistryCancelSRRCommitment(address from,uint256 nonce,uint256 tokenId)"
    },
    {
      createdAt: "1626785824000",
      id: "0xff1b6ae7ba3b6fcaf8441b4b7ebbebb22444db035e8eb25feb17296a6c00b54b",
      typeHash:
        "0xff1b6ae7ba3b6fcaf8441b4b7ebbebb22444db035e8eb25feb17296a6c00b54b",
      typeString:
        "WalletChangeThreshold(address from,uint256 nonce,address wallet,uint256 threshold)"
    }
  ]
  expect(result.metaTxRequestTypes).toStrictEqual(data)
})

test("metaTxExecutions", async () => {
  const query = `
  {
    metaTxExecutions {
      id
      txHash
      createdAt
    }
  }
`
  const result = await client.query(query)

  const data = {
    createdAt: "1626785849000",
    id: "0x7581cb842e565b3e27a43a7ff9ff28f8876c50938e93ef45c9ac972d7ed9be30",
    txHash: "0x7581cb842e565b3e27a43a7ff9ff28f8876c50938e93ef45c9ac972d7ed9be30"
  }

  expect(result.metaTxExecutions[0]).toStrictEqual(data)
})

test("srrprovenances", async () => {
  const query = `
  {
    srrprovenances {
      id
      timestamp
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
      createdAt
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      createdAt: "1627796084000",
      customHistory: null,
      from: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f",
      id: "0x24747b9ea314235b1720f423fae488ea20da5423e4f7c268e6c8f1d39f87bb84",
      isIntermediary: false,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "43593516"
      },
      timestamp: "1627796084000",
      to: "0xb31f2241cb4d48dcf7825a75b46b4f6b13829a20"
    },
    {
      createdAt: "1627796070000",
      customHistory: null,
      from: "0x0324fe78b2068036513b3618e1436d64ca64e136",
      id: "0xa1186d255cb48845d6b0eac240018cf1a41fe907a01c0cb556ee6c91ae63301e",
      isIntermediary: false,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "43593516"
      },
      timestamp: "1627796070000",
      to: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f"
    },
    {
      createdAt: "1627796081000",
      customHistory: null,
      from: "0x0324fe78b2068036513b3618e1436d64ca64e136",
      id: "0xeb02d072b7973fd7bda981c5741a72ec5cffe8e0daf6b2f7c69dea562cc9cc86",
      isIntermediary: true,
      metadataDigest:
        "0xba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70",
      metadataURI:
        "https://api.startrail.io/api/v1/metadata/ba136728b9ccfc56aa07d354fb7b5b026fa8123ad74f2fdb7a938bdf08c77a70.json",
      srr: {
        id: "10255373"
      },
      timestamp: "1627796081000",
      to: "0xf1dbd215d72d99422693ca61f7bbecfcd0edb16f"
    }
  ]

  expect(result.srrprovenances).toStrictEqual(data)
})

test("srrtransferCommits", async () => {
  const query = `
  {
    srrtransferCommits {
      id
      commitment
      lastAction
      createdAt
      updatedAt
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      commitment: null,
      createdAt: "1627796080000",
      id: "10255373",
      lastAction: "transfer",
      updatedAt: "1627796081000"
    },
    {
      commitment: null,
      createdAt: "1627796069000",
      id: "43593516",
      lastAction: "transfer",
      updatedAt: "1627796084000"
    }
  ]

  expect(result.srrtransferCommits).toStrictEqual(data)
})

test("bulkIssues", async () => {
  const query = `
  {
    bulkIssues {
      id
      merkleRoot
      srrs
      issuer
      tokenId
      createdAt
      updatedAt
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      createdAt: "1627796072000",
      id: "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      issuer: "0x0324fe78b2068036513b3618e1436d64ca64e136",
      merkleRoot:
        "0x5b985b5b195a77df122842687feb3fa0136799d0e7a6e7394adf504526727251",
      srrs: [],
      tokenId: null,
      updatedAt: "1627796072000"
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
        createdAt
      }
      name
      metadataDigest
      srrHistory {
        id
        createdAt
      }
      originChain
      originTxHash
      createdAt
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      createdAt: "1627796076000",
      historyType: {
        createdAt: "1627796022000",
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
          createdAt: "1627796077000",
          id:
            "0xe816ba014d36a530fa00332e555613d1678221f17419b1bc9216e9af7ed98578"
        }
      ]
    }
  ]

  expect(result.customHistories).toStrictEqual(data)
})

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
      createdAt
    }
  }
`
  const result = await client.query(query)

  const data = [
    {
      createdAt: "1627796077000",
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
