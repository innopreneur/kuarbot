import { ChainId, Token, TokenAmount, Pair, JSBI, Route, Price, Trade, TradeType } from '@uniswap/sdk'
import path from 'path'
import routerABI from '../../abi/UniswapRouterABI'
import erc20ABI from '../../abi/ERC20TokenABI'
import { getWeb3Instance, parseAmountToStr, parseAmountToBigInt, readableBalance } from '../utils/web3'
import { sendTx } from '../utils/signer'
import { logger } from '../utils/logger'
import tokenConfig from '../utils/token'

require('dotenv').config()

let fileName = path.basename(__filename)
let web3 = getWeb3Instance()

class Uniswap {
    constructor() {
        this.from = process.env.FROM
        this.type = 'dex'
        this.tx = null
        this.routerAddress = {
            MAINNET: "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a",
            RINKEBY: "0xf164fC0Ec4E93095b804a4795bBe1e041497b92a"
        }
        this.txTimeout = 300000
    }

    async isOrderComplete(txHash) {
        try {
            let resp = await web3.eth.getTransactionReceipt(txHash)
            if (resp.status == null) {
                return false
            } else if (resp.status == false) {
                throw Error(resp)
            } else if (resp.status) {
                return true
            }

        } catch (err) {
            console.error(err)
        }
    }

    tradingFee(symbol = "") {
        return 0.003
    }


    async getBestSwap(baseToken, quoteToken, inputToken, inputAmount) {

        const base = new Token(ChainId.MAINNET, baseToken, 18)
        const quote = new Token(ChainId.MAINNET, quoteToken, 18)
        const inToken = new Token(ChainId.MAINNET, inputToken, 18)

        let pair = await Pair.fetchData(base, quote)
        let amt = parseAmountToStr(inputAmount).toString()
        let route = new Route([pair], inToken)
        let t = new Trade(route, new TokenAmount(inToken, amt), TradeType.EXACT_INPUT)
        logger.info(`Base Reserve - ", ${pair.reserve0.toSignificant(10)}`)
        logger.info(`Quote Reserve - ", ${pair.reserve1.toSignificant(10)}`)
        let slippage = t.slippage.toSignificant(4)
        let op = t.outputAmount.toSignificant(7)
        return op

    }

    async calculateTxFees() {
        return 0.0000000000003
    }
    async  getBalance(tokenAddress = null) {
        try {
            if (!tokenAddress) {
                let balance = await web3.eth.getBalance(this.from)
                return readableBalance(balance)
            } else {
                let tokenContract = await web3.eth.contract(erc20ABI, tokenAddress)
                let balance = await tokenContract.methods.balanceOf(this.from).call()
                return readableBalance(balance)
            }
        } catch (err) {
            console.log(err)
        }
    }

    getTokenAddress(symbol) {
        return tokenConfig[symbol].address
    }

    async _sendSwapTx(path, inputAmount, minOutAmount, inputSymbol, toAddress) {
        let txHash = null
        try {
            let web3 = getWeb3Instance(3)
            const routerContract = new web3.eth.Contract(
                routerABI,
                this.routerAddress.RINKEBY
            )

            if (inputSymbol == 'WETH') {
                let txData = await routerContract.methods.swapExactETHForTokens(
                    minOutAmount,
                    path,
                    toAddress,
                    Date.now() + this.txTimeout
                ).encodeABI()
                txHash = await sendTx(txData, this.from, this.routerAddress.RINKEBY, 'FASTEST', inputAmount)
            } else {
                let txData = await routerContract.methods.swapExactTokensForETH(
                    inputAmount,
                    minOutAmount,
                    path,
                    toAddress,
                    Date.now() + this.txTimeout
                ).encodeABI()
                txHash = await sendTx(txData, this.from, this.routerAddress.RINKEBY, 'FASTEST', 0)
            }
        } catch (err) {
            logger.error(err.message)
        }

        return txHash

    }

    async swap(inputAddress, outputAddress, inputAmount, minOutputAmount, inputSymbol, toAddress = process.env.FROM) {
        let path = [inputAddress, outputAddress]
        return await this._sendSwapTx(path, parseAmountToBigInt(inputAmount), parseAmountToBigInt(minOutputAmount), inputSymbol, toAddress)
    }

}

const uniswap = new Uniswap()
export default uniswap