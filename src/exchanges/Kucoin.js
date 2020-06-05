const api = require('kucoin-node-api')
import axios from 'axios'
require('dotenv').config()



class Kucoin {
    constructor() {
        const config = {
            apiKey: process.env.kucoin_API_KEY,
            secretKey: process.env.kucoin_SECRET,
            passphrase: process.env.kucoin_PASSWORD,
            environment: 'live'
        }
        this.type = 'cex'
        api.init(config)
    }

    async placeOrder(symbol, side, quantity, price, type = "market") {
        try {
            let params = {
                clientOid: Date.now(),
                side,
                symbol,
                type,
                price,
                size: quantity
            }

            let resp = await api.placeOrder(params)
            console.log(JSON.stringify(resp))
            if (resp.code != "200000") {
                return Error(JSON.stringify(resp))
            }
            return resp.data.orderId
        } catch (err) {
            //console.error(err)
            process.exit(1)
        }
    }

    async getOrders(params) {
        try {
            return await api.getOrders(params)
        } catch (err) {
            console.error(err)
        }
    }

    async getIncrementalSize(ticker, rawSize, side) {
        try {
            let url = `https://api.kucoin.com/api/v1/symbols`
            let response = await axios(url)
            let resp = await response.data
            if (resp.code != "200000") {
                return Error(JSON.stringify(resp))
            }
            let found = resp.data.filter(tick => {
                return ticker == tick.name
            })
            if (found.length) {
                if (side == 'buy') {
                    let size = Number(rawSize) - Number(found[0].quoteIncrement)
                    console.log("size = ", size)
                    return size
                } else {
                    let size = Number(rawSize) - Number(found[0].baseIncrement)
                    console.log("size = ", size)
                    return size
                }

            }
        } catch (err) {
            console.error(err)
        }
    }
    async getFiatPrices(token) {
        try {
            let url = `https://api.kucoin.com/api/v1/prices`
            let response = await axios(url)
            let resp = await response.data
            if (resp.code != "200000") {
                return Error(JSON.stringify(resp))
            }
            return resp.data[token]
        } catch (err) {
            console.error(err)
        }
    }
    async getOrderbook(ticker) {
        try {
            let resp = await api.getPartOrderBook({ amount: 100, symbol: ticker })
            if (resp.code != "200000") {
                return Error(JSON.stringify(resp))
            }
            return resp.data
        } catch (err) {
            console.error(err)
        }
    }

    async isOrderComplete(orderId) {
        try {
            let resp = await api.getOrderById({ id: orderId })
            if (resp.code != "200000") {
                return Error(JSON.stringify(resp))
            }
            let order = resp.data
            if (order.isActive != null && !order.isActive && !order.cancelExist) {
                return true
            }
            return false
        } catch (err) {
            console.error(err)
        }
    }

    tradingFee(symbol) {
        return 0.0008
    }

    async getPairsFor(symbol) {
        try {
            let resp = await api.getAllTickers()
            if (resp.code != "200000") {
                return Error(JSON.stringify(resp))
            }
            let tickers = [...resp.data.ticker]
            let symbols = tickers.filter(ticker => {
                return ticker.symbol.includes(symbol)
            })
            let pairs = await Promise.all(symbols.map(sym => sym.symbol))

            return pairs

        } catch (err) {
            console.error(err)
        }
    }
    async getWithdrawalFee(symbol) {
        try {
            let currency = await api.getCurrency(symbol)
            if (currency) {
                return currency.withdrawalMinFee
            }
            return null

        } catch (err) {
            console.error(err)
        }
    }
    async getBestDeal(ticker, side) {
        try {
            let url = `https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=${ticker}`
            let response = await axios(url)
            let resp = await response.data
            if (resp.code != "200000") {
                return Error(JSON.stringify(resp))
            }
            if (side == 'BUY') {
                return { price: Number(resp.data.bestAsk), size: Number(resp.data.bestAskSize) }
            } else {
                return { price: Number(resp.data.bestBid), size: Number(resp.data.bestBidSize) }
            }

        } catch (err) {
            console.error(err)
        }
    }


    async  getAccounts() {
        try {
            const config = {
                apiKey: process.env.kucoin_API_KEY,
                secretKey: process.env.kucoin_SECRET,
                passphrase: process.env.kucoin_PASSWORD,
                environment: 'live'
            }

            api.init(config)

            let r = await api.getAccounts()
            console.log(r.data)
        } catch (err) {
            console.log(err)
        }
    }

    getTicker(params) {
        return `${params.baseToken}-${params.quoteToken}`
    }
}

const kucoin = new Kucoin()
export default kucoin