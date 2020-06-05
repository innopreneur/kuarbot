import moment from 'moment'

export function getNextTimeSlot(lastclosetime, interval) {
    let startTime = lastclosetime + 1
    let endTime = lastclosetime + intervaltoMs(interval)
    return { startTime, endTime }
}

export function intervaltoMs(interval) {
    switch (interval) {
        case '1m':
            return 60000
        case '3m':
            return 180000
        case '5m':
            return 300000
        case '15m':
            return 15 * 60000
        case '30m':
            return 30 * 60000
        case '1h':
            return 60 * 60000
        case '2h':
            return 120 * 60000
        case '4h':
            return 240 * 60000
        case '6h':
            return 360 * 60000
        case '8h':
            return 480 * 60000
        case '12h':
            return 12 * 60 * 60000
        case '1d':
            return 24 * 60 * 60000
        case '3d':
            return 3 * 24 * 60 * 60000
        case '1w':
            return 7 * 24 * 60 * 60000
        case '1M':
            return 30 * 24 * 60 * 60000
    }
}