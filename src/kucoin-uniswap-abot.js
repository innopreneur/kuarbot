import { default as kucoin } from './exchanges/Kucoin'
import { default as uniswap } from './exchanges/Uniswap'
import moment from 'moment'
import { logger } from './utils/logger'
import { readableBalance, getGasPrice } from './utils/web3'
import { sendMessage } from './utils/notifier'
import { sleep } from './utils/wait'
require('dotenv').config()

let baseTokenSymbol = process.env.BaseTokenSymbol
let quoteTokenSymbol = process.env.QuoteTokenSymbol
let baseToken = process.env.BaseTokenAddress
let quoteToken = process.env.QuoteTokenAddress
let kFees = kucoin.tradingFee()
let uFees = uniswap.tradingFee()
let gasLimit = 200000
let OCEANTakeProfitAmt = Number(process.env.BaseTokenTakeProfitAmt)
let WETHTakeProfitAmt = Number(process.env.QuoteTokenTakeProfitAmt)
let kucoinPair = process.env.kucoinPair
let maxBaseToken = Number(process.env.maxBaseTokenAmt)

//start trading
export async function startLoop() {

    while (true) {
        try {
            logger.info(`Starting next loop at ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')} `)
            await doSellFirst()
            await doBuyFirst()
            await sleep(4)
        } catch (err) {
            if (!err.message.includes("failed to meet quorum")) {
                await sendMessage(`
                xxxxx ERROR xxxxxx
                [KU-ARBOT]
                ${err.message}
                `)
            }
            console.error(err)

        }
    }

}

function calculateProfit(cost, income) {
    return income - cost
}

async function doSellFirst() {
    //SELL first 
    let { bids } = await kucoin.getOrderbook(kucoinPair)
    let price = getAveragePrice(maxBaseToken, bids)
    logger.info(`${baseTokenSymbol}-${quoteTokenSymbol} (sell) -> Raw Kucoin cost - ${maxBaseToken}`)
    let baseIn = maxBaseToken
    let quoteIn = ((price * maxBaseToken) - (price * maxBaseToken * kFees)).toString()
    //check price on Uniswap
    let baseOut = await uniswap.getBestSwap(baseToken, quoteToken, quoteToken, quoteIn)
    logger.info(`${quoteTokenSymbol}-${baseTokenSymbol} (swap) -> Raw Uniswap income ${baseTokenSymbol} - ${baseOut}`)
    let gasPrice = await getGasPrice("FASTEST")
    let txFees = readableBalance(gasPrice * gasLimit) / price
    let profit = calculateProfit(baseIn, baseOut - (baseOut * uFees) - txFees)
    console.log("------------------------------")
    console.log(`Profit in ${baseTokenSymbol} : ${profit}`)
    console.log("------------------------------")
    if (profit > OCEANTakeProfitAmt) {
        console.log(`TRADE FOR ${baseTokenSymbol}------------------`)
        //swap quote for base in Uniswap
        //await uniswap.swap(quoteToken, baseToken, quoteIn, baseOut, quoteTokenSymbol, process.env.FROM)


        //TODO check if Order is fulfilled


        //sell base on Kucoin
        ///await kucoin.placeOrder(kucoinPair, 'sell', maxBaseToken, price, "limit")
        //notify
        await sendMessage(`
        --- KU-ARBOT ------
        Sold ${maxBaseToken} ${baseTokenSymbol} in Kucoin
        Got ${baseOut} ${baseTokenSymbol} from Uniswap
        -------------------
        Profit = ${profit} ${baseTokenSymbol}
        -------------------
        `)

    }

}

async function doBuyFirst() {
    //BUY first 
    let { asks } = await kucoin.getOrderbook(kucoinPair)
    let price = getAveragePrice(maxBaseToken, asks)
    logger.info(`${quoteTokenSymbol}-${baseTokenSymbol} (buy) -> Raw Kucoin cost - ${maxBaseToken}`)
    let quoteIn = price * maxBaseToken
    let baseIn = maxBaseToken - (maxBaseToken * kFees)
    //check price on Uniswap
    let quoteOut = await uniswap.getBestSwap(baseToken, quoteToken, baseToken, baseIn)
    logger.info(`${baseTokenSymbol}-${quoteTokenSymbol} (swap) -> Raw Uniswap income ${quoteTokenSymbol} - ${quoteOut}`)
    let gasPrice = await getGasPrice("FASTEST")
    let txFees = readableBalance(gasPrice * gasLimit)
    let profit = calculateProfit(quoteIn, quoteOut - (quoteOut * uFees) - txFees)
    console.log("------------------------------")
    console.log(`Profit in ${quoteTokenSymbol} :  ${profit}`)
    console.log("------------------------------")
    if (profit > WETHTakeProfitAmt) {
        console.log(`TRADE FOR ${quoteTokenSymbol} ------------------`)
        //swap base for quote in Uniswap
        //await uniswap.swap(baseToken, quoteToken, baseIn, quoteOut, baseTokenSymbol, process.env.FROM)


        //TODO check if Order is fulfilled



        //sell baseToken on Kucoin
        //await kucoin.placeOrder(kucoinPair, 'sell', maxBaseToken, price, "limit")
        //notify
        await sendMessage(`
        --- KU-ARBOT ------
        Sold ${quoteIn} ${quoteTokenSymbol} in Kucoin
        Got ${quoteOut} ${quoteTokenSymbol} from Uniswap
        -------------------
        Profit = ${profit} ${quoteTokenSymbol}
        -------------------
        `)
    }
}

function getAveragePrice(expected, orders) {
    let i = 0, size = 0, price = 0
    while (i < orders.length && size <= expected) {
        size += Number(orders[i][1])
        price += Number(orders[i][0])
        i++
    }
    return (price / i)
}

startLoop()