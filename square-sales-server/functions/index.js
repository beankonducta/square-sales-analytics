const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const square = require("square");
const Client = square.Client;
const Environment = square.Environment;
require("dotenv").config()

const client = new Client({
    accessToken: process.env.SQUARE_TOKEN,
    environment: Environment.Production
})

// Returns a list of locations
exports.locations = functions.https.onRequest(async (req, res) => {
    const response = await client.locationsApi.listLocations();
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).send(JSON.parse(response.body));
})

// Returns a list of timecards, based on provided date and location
exports.timecards = functions.https.onRequest(async (req, res) => {
    const response = await client.laborApi.searchShifts({
        query: {
            filter: {
                locationIds: [
                    req.query.locationId
                ],
                workday: {
                    dateRange: {
                        startDate: req.query.start,
                        endDate: req.query.end
                    }
                }
            }
        }
    })
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).send(JSON.parse(response.body));
})

// Returns an object of sales data, based on provided date range and location
// might run into issues without pagination!
exports.sales = functions.runWith({timeoutSeconds: 540, memory: '8GB'}).https.onRequest(async (req, res) => {
    let salesData = { days: 0, salesCount: 0, openHours: 0, totals: { total: 0, tip: 0 }, byHour: [] }
    for (let i = 0; i < 23; i++)
        salesData.byHour.push({ hour: i, total: 0, tip: 0 })
    const { start, end, locationId } = req.query
    let cursor;
    do {
        const response = await client.ordersApi.searchOrders({
            locationIds: [
                locationId
            ],
            query: {
                filter: {
                    dateTimeFilter: {
                        createdAt: {
                            startAt: start,
                            endAt: end
                        }
                    },
                }
            },
            cursor: cursor
        })
        response.result.orders.forEach(order => {
            // hacky, the time on square is 6 hours ahead of mountain standard so we subtract 6
            const hour = new Date(order.createdAt).toISOString().slice(0, 13).split("T")[1] - 6
            // total values are stored in cents so divide by 100
            const total = +Math.round(order.totalMoney.amount.toString().replace("n", "") / 100)
            const tip = +Math.round(order.totalTipMoney.amount.toString().replace("n", "") / 100)
            const sale = { total, tip, hour }
            salesData.totals.total += total
            salesData.totals.tip += tip
            //salesData.sales += sale
            if (salesData.byHour[hour]) {
                salesData.byHour[hour].total += total
                salesData.byHour[hour].tip += tip
            }
            salesData.salesCount++;
        })
        cursor = response.result.cursor
    } while (cursor)
    salesData.days = Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24));
    salesData.byHour.forEach(hour => {
        if (hour.total > 0)
            salesData.openHours++;
    })
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).send(salesData);
})