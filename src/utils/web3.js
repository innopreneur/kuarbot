import Web3 from 'web3'
import axios from 'axios'
import BigNumber from 'bignumber.js'
require('dotenv').config()

export function getWeb3Instance(chainId) {
    console.log(process.env.WEB3_NODE)
    if (chainId == 1) {
        return new Web3(`https://mainnet.infura.io/v3/${process.env.WEB3_NODE}`)
    } else if (chainId == 3) {
        return new Web3(`https://rinkeby.infura.io/v3/${process.env.WEB3_NODE}`)
    } else {
        return new Web3(`https://rinkeby.infura.io/v3/${process.env.WEB3_NODE}`)
    }

}

//make amount to readable format
export function readableBalance(preformattedAmount, decimals = 18) {
    let bn = new BigNumber(Number(preformattedAmount));
    let tokenUnit = new BigNumber(10);
    tokenUnit = tokenUnit.pow(-1 * decimals);
    return (bn.multipliedBy(tokenUnit)).toPrecision();
}

export async function getGasPrice(execution) {
    let response = await axios(process.env.GAS_PRICE_INFO)
    let gasPrice = await response.data

    switch (execution) {
        case "FASTEST":
            return gasPrice.fastest
        case "NORMAL":
            return gasPrice.standard
        case "SLOW":
            return gasPrice.safeLow
        case "FAST":
            return gasPrice.fast
        default:
            return gasPrice.fast
    }
}

export function parseAmountToStr(amount, decimals = 18) {
    console.log('input - ', amount)
    let str = amount.toString()
    if (str.includes('e-')) {
        let f = str.split('e-')
        decimals = decimals - f[1]
        str = f[0]
    }
    let frags = str.split(".")
    if (frags.length == 2) {
        let fractions = frags[1]
        let integers = frags[0]
        fractions = fractions.length > decimals ? Math.ceil(fractions / 10 ** (fractions.length - decimals)) : fractions
        let zcount = decimals - fractions.length
        let zeros = '0'.repeat(zcount)
        let finalAmtStr = integers.concat(fractions, zeros)
        console.log("Processed Amount - ", finalAmtStr)
        return finalAmtStr
    } else if (frags.length == 1) {
        console.log("Processed Amount - ", str)
        return str
    } else {
        console.error("invalid amount -" + amount)
        throw new Error("invalid amount -" + amount)
    }
}

export function parseAmountToBigInt(amount, decimals = 18) {
    let bigint = parseAmountToStr(amount, decimals)
    return new BigNumber(bigint)
}
