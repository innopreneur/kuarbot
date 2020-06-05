import { default as kucoin } from './exchanges/Kucoin'
import { default as uniswap } from './exchanges/Uniswap'
import moment from 'moment'
import { logger } from './utils/logger'
import { readableBalance, getGasPrice } from './utils/web3'
import { sendMessage } from './utils/notifier'
import { sleep } from './utils/wait'

let OCEAN = "0x985dd3d42de1e256d09e1c10f112bccb8015ad41"
let WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
let kFees = kucoin.tradingFee()
let uFees = uniswap.tradingFee()
let gasLimit = 200000
let OCEANTakeProfitAmt = 150
let WETHTakeProfitAmt = 0.05

//start trading
export async function startLoop() {

    while (true) {
        try {
            logger.info(`Starting next loop at ${moment(Date.now()).format('DD/MM/YYYY HH:mm:ss')} `)
            await doSellFirst()
            await doBuyFirst()
            await sleep(4)
        } catch (err) {
            console.error(err)
            await sendMessage(`
            xxxxx ERROR xxxxxx
            [KU-ARBOT]
            ${err.message}
            `)
        }
    }

}

function calculateProfit(cost, income) {
    return income - cost
}

async function doSellFirst() {
    //SELL first 
    let { price, size } = await kucoin.getBestDeal('OCEAN-ETH', 'sell')
    logger.info(`O-E (sell) -> Raw Kucoin cost - ${size}`)
    let OCEANIn = size
    let WETHIn = ((price * size) - (price * size * kFees)).toString()
    //check price on Uniswap
    let OCEANOut = await uniswap.getBestSwap(OCEAN, WETH, WETH, WETHIn)
    logger.info(`E-O (swap) -> Raw Uniswap income OCEAN - ${OCEANOut}`)
    let gasPrice = await getGasPrice("FASTEST")
    let txFees = readableBalance(gasPrice * gasLimit) / price
    let profit = calculateProfit(OCEANIn, OCEANOut - (OCEANOut * uFees) - txFees)
    console.log("------------------------------")
    console.log(`Profit in OCEANs : ${profit}`)
    console.log("------------------------------")
    if (profit > OCEANTakeProfitAmt) {
        console.log("TRADE FOR OCEAN------------------")
        //swap WETH for OCEAN in Uniswap
        //await uniswap.swap(WETH, OCEAN, WETHIn, OCEANOut, "WETH", process.env.FROM)


        //TODO check if Order is fulfilled


        //sell OCEAN on Kucoin
        ///await kucoin.placeOrder('OCEAN-ETH', 'sell', size, price, "limit")
        //notify
        await sendMessage(`
        --- KU-ARBOT ------
        Sold ${size} OCEAN in Kucoin
        Got ${OCEANOut} OCEAN from Uniswap
        -------------------
        Profit = ${profit} OCEAN
        -------------------
        `)

    }

}

async function doBuyFirst() {
    //BUY first 
    let { price, size } = await kucoin.getBestDeal('OCEAN-ETH', 'buy')
    logger.info(`O-E (buy) -> Raw Kucoin cost - ${size}`)
    let WETHIn = price * size
    let OCEANIn = size - (size * kFees)
    //check price on Uniswap
    let WETHOut = await uniswap.getBestSwap(OCEAN, WETH, OCEAN, OCEANIn)
    logger.info(`O-E (swap) -> Raw Uniswap income ETH - ${WETHOut}`)
    let gasPrice = await getGasPrice("FASTEST")
    let txFees = readableBalance(gasPrice * gasLimit)
    let profit = calculateProfit(WETHIn, WETHOut - (WETHOut * uFees) - txFees)
    console.log("------------------------------")
    console.log(`Profit in ETH :  ${profit}`)
    console.log("------------------------------")
    if (profit > WETHTakeProfitAmt) {
        console.log("TRADE FOR WETH------------------")
        //swap OCEAN for WETH in Uniswap
        //await uniswap.swap(OCEAN, WETH, OCEANIn, WETHOut, "OCEAN", process.env.FROM)


        //TODO check if Order is fulfilled



        //sell OCEAN on Kucoin
        //await kucoin.placeOrder('OCEAN-ETH', 'sell', size, price, "limit")
        //notify
        await sendMessage(`
        --- KU-ARBOT ------
        Sold ${WETHIn} ETH in Kucoin
        Got ${WETHOut} WETH from Uniswap
        -------------------
        Profit = ${profit} ETH
        -------------------
        `)
    }
}

startLoop()