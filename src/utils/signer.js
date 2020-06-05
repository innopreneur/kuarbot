const Tx = require("ethereumjs-tx").Transaction
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { getWeb3Instance, getGasPrice } from './web3'
require('dotenv').config()


async function sendTx(txData, from, to, execution, value) {
  try {
    //instantite web3
    let web3 = getWeb3Instance()
    //get current nonce
    let nonce = await web3.eth.getTransactionCount(from, "pending")
    console.log(`Nonce for ${from} - ${nonce}`)

    //prepare unsigned tx
    let gasPrice = await getGasPrice(execution)
    console.log(`Estimated Gas Price - ${gasPrice}`)
    console.log('Data - ', txData)
    console.log(`To - `, to)
    let rawTransaction = {
      nonce,
      gasPrice: web3.utils.toHex(parseInt(gasPrice) + 20),
      gasLimit: web3.utils.toHex(1000000),
      to: to,
      value: web3.utils.toHex(web3.utils.toWei(value, "ether")),
      data: txData
    }

    let tx = new Tx(rawTransaction, { 'chain': 'rinkeby' })
    //sign the transaction
    let privKey = new Buffer.from(process.env.KEY, "hex")
    //sign the transaction
    tx.sign(privKey)
    console.log(`Signed tx`)
    //serialize the given tx to send it to blockchain
    let serializedTx = tx.serialize()
    console.log(`Tx serialised`)
    // send our signed tx to ethereum blockchain
    let signedTx = web3.eth.sendSignedTransaction(
      "0x" + serializedTx.toString("hex")
    )
    console.log(`Tx sent to the node`)

    //wait for confirmation
    return await new Promise((resolve, reject) => {
      signedTx
        .on("transactionHash", function (hash) {
          console.log(`Tx sent to network with id - ${hash}`)
          signedTx.off("transactionHash")
          resolve(null, hash)
        })
        .on("error", function (error) {
          reject(error)
        })
    })
  } catch (error) {
    console.error(error)
  }
}



export { sendTx }
