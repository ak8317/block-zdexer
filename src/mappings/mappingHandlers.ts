// Copyright 2020-2022 OnFinality Limited authors & contributors
// SPDX-License-Identifier: Apache-2.0
import {
  BlockEntity, TransactionEntity,EvmLog

} from "../types";
import {
  AvalancheBlock, AvalancheLog, AvalancheTransaction,

} from "@subql/types-avalanche";
import { providers } from "ethers"
import { inputToFunctionSighash, isZero } from "./utils";
import { Erc1155, Erc1155__factory, Erc721, Erc721__factory } from "../contracts";
import { Account } from "../types/models";
import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname+'../../.env') });

export async function handleBlock(block: AvalancheBlock & {extraData: string;}): Promise<void> {

  const BlockInfo={
    blockExtraData : block.blockExtraData,
    extraData : block.extraData,
    extDataHash :block.extDataHash,
    logsBloom :block.logsBloom,
    miner :block.miner,
    nonce :block.nonce,
    parentHash :block.parentHash,
    receiptsRoot :block.receiptsRoot,
    sha3Uncles :block.sha3Uncles,
    stateRoot :block.stateRoot,
    transactionsRoot :block.transactionsRoot,
    uncles :block.uncles,
    transactionCount:block.transactions.length
  }

  const BlockGasInfo={
    gasLimit :block.gasLimit?block.gasLimit.toString():"0",
    gasUsed : block.gasUsed?block.gasUsed.toString():"0",
    blockGasCost :block.blockGasCost?block.blockGasCost.toString():"0",
    extDataGasUsed :block.extDataGasUsed,
    baseFeePerGas : block.baseFeePerGas?block.baseFeePerGas.toString():"0"
  }
  const blockRecord = new BlockEntity(block.number.toString());
  
 
  blockRecord.hash = block.hash;
  blockRecord.size = block.size;
  blockRecord.timestamp = new Date(Number(block.timestamp)*1000);
  blockRecord.blockInfo=BlockInfo
  blockRecord.blockGasInfo=BlockGasInfo

  await blockRecord.save();
}


async function checkBlockExists(blockHash: string, blockNumber: number) {
  let blockEntity = await BlockEntity.get(blockNumber.toString());
  if (!blockEntity) {
    blockEntity = new BlockEntity(blockNumber.toString());
    blockEntity.hash = blockHash;
    await blockEntity.save();
  }
}

export async function handleTransaction(
  transaction: AvalancheTransaction
): Promise<void> {
  logger.info("Transaction");
  await checkBlockExists(transaction.blockHash, transaction.blockNumber);


  const TransactionInfo={
    
    type: transaction.type,
    v: transaction.v.toString(),
    r: transaction.r,
    s: transaction.s,
    accessList: transaction.accessList
  }

  const TransactionCounter={
    nonce:  transaction.nonce?transaction.nonce.toString():"0",
    transactionIndex: transaction.transactionIndex?transaction.transactionIndex.toString():"0"
  }
  const TransactionGasInfo={
    gas :transaction.gas?transaction.gas.toString():"0",
    gasPrice :transaction.gasPrice?transaction.gasPrice.toString():"0",
    maxFeePerGas :transaction.maxFeePerGas?transaction.maxFeePerGas.toString():"0",
    maxPriorityFeePerGas :transaction.maxPriorityFeePerGas?transaction.maxPriorityFeePerGas.toString():"0",
    receipt_effective_gas_price:transaction.receipt.effectiveGasPrice?transaction.receipt.effectiveGasPrice.toString():"0",
    receipt_cumulative_gas_used:transaction.receipt.cumulativeGasUsed?transaction.receipt.cumulativeGasUsed.toString():"0",
    receipt_gas_used:transaction.receipt.gasUsed?transaction.receipt.gasUsed.toString():"0"
  }
  const transactionRecord = new TransactionEntity(
   transaction.hash
  );
  transactionRecord.blockId = transaction.blockNumber.toString();
  transactionRecord.from = transaction.from
  
  transactionRecord.input = transaction.input;
  transactionRecord.to = transaction.to;
  transactionRecord.value = transaction.value;
  
  transactionRecord.receipt_status=transaction.receipt.status
  transactionRecord.contractAddress=transaction.receipt.contractAddress
  transactionRecord.transactionInfo=TransactionInfo;
  transactionRecord.transactionGasInfo=TransactionGasInfo
  transactionRecord.transactionCounter=TransactionCounter
  await transactionRecord.save();

  if(transaction.from && transaction.to==null && transaction.receipt.status){
    //Contract Deployed transaction
    const avalancheURLTmp = "https://pramodzeeve:juys947abhg4L@zeeve.zdexer-avax-cc2b6b.zeeve.net?apikey=pramodzeeve:juys947abhg4L" //process.env.API_ENDPOINT_AND_KEY
    const avalancheURL = avalancheURLTmp.split("?")[0] + '/ext/bc/C/rpc?' + avalancheURLTmp.split("?")[1]
	  const customHttpProvider = new providers.JsonRpcProvider(avalancheURL);
    const address=transaction.receipt.contractAddress 
    const erc721ContractFactory=Erc721__factory.connect(address,customHttpProvider)
    const erc1155ContractFactory = Erc1155__factory.connect(
      address,
      customHttpProvider
    );
    const isERC721=await supportsInterface(erc721ContractFactory, '80ac58cd')
    const isERC1155=await supportsInterface(erc1155ContractFactory, 'd9b67a26')
    
    if(isERC721){
      const account=await fetchAccount(transaction.from)
      account.erc721Contracts.push(address)
      await account.save()
    }
    if(isERC1155){
      const account=await fetchAccount(transaction.from)
      account.erc1155Contracts.push(address)
      await account.save()
    }
    if(!isERC1155 && !isERC1155){
      const account=await fetchAccount(transaction.from)
      account.contracts.push(address)
      await account.save()
    }

  }
}
export async function fetchAccount(address: string): Promise<Account >{
	let account=await Account.get(address)

	if(!account){
		account=Account.create({
			id:address,
      erc1155Contracts:[],
      erc721Contracts:[],
      contracts:[]
		})
    await account.save()
	}
	
	return account
}

export async function supportsInterface(contractFactory:Erc721|Erc1155,interfaceId:string,expected:boolean=true):Promise<boolean>{
  try {
      let result=await contractFactory.supportsInterface(`0x${interfaceId}`)
  
      return result==expected
  } catch (error) {
      return false
  }
 
}

async function checkTransactionExists(transactionHash: string,blockNumber: number) {
  let transactionEntity = await TransactionEntity.get(transactionHash);
  if (!transactionEntity) {
    transactionEntity = new TransactionEntity(transactionHash);
    transactionEntity.blockId=blockNumber.toString()
    await transactionEntity.save();
  }
}
export async function handleLog(log: AvalancheLog): Promise<void> {
  // logger.info("log");
  await checkTransactionExists(log.transactionHash,log.blockNumber);

  const LogInfo={
    data : log.data,
    logIndex : log.logIndex
  }
  const logRecord = new EvmLog(`${log.transactionHash}-${log.logIndex}`);
  logRecord.address = log.address;
  logRecord.removed = log.removed;
  // logRecord.topics = log.topics;
  logRecord.blockHeight= log.blockNumber,
  logRecord.topics0= log.topics[0],
  logRecord.topics1= log.topics[1],
  logRecord.topics2= log.topics[2],
  logRecord.topics3= log.topics[3]
  logRecord.logInfo=LogInfo
  logRecord.transactionId=log.transactionHash
  logRecord.blockId=log.blockNumber
  
  await logRecord.save();
}

// Commented out for performance
// export async function handleReceipt(
//   transaction: AvalancheTransaction
// ): Promise<void> {
//   const receipt = transaction.receipt;
//   const receiptRecord = new ReceiptEntity(
//     `${receipt.blockHash}-${receipt.transactionHash}`
//   );
//   receiptRecord.blockId = receipt.blockHash;
//   receiptRecord.blockHash = receipt.blockHash;
//   receiptRecord.blockNumber = receipt.blockNumber;
//   receiptRecord.contractAddress = receipt.contractAddress;
//   receiptRecord.cumulativeGasUsed = receipt.cumulativeGasUsed;
//   receiptRecord.effectiveGasPrice = receipt.effectiveGasPrice;
//   receiptRecord.from = receipt.from;
//   receiptRecord.gasUsed = receipt.gasUsed;
//   receiptRecord.logsBloom = receipt.logsBloom;
//   receiptRecord.status = receipt.status;
//   receiptRecord.to = receipt.to;
//   receiptRecord.transactionHash = receipt.transactionHash;
//   receiptRecord.transactionIndex = receipt.transactionIndex;
//   receiptRecord.type = receipt.type;
//   await receiptRecord.save();
// }

