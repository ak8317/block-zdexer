query blocks{
  avalancheBlockEntities{
    totalCount
    nodes{
      id
      hash
      size
      timestamp
      blockGasInfo
      blockInfo
    }
  }
}

query txns{
  avalancheTransactionEntities{
    totalCount
    nodes{
      id
      block{
        id
      }
      from
      to
      value
      status
      contractAddress
      transactionGasInfo
      transactionInfo
      input
      
    }
  }
}