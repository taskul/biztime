// Tell Node that we're in test "mode"
// by default node is not in a test mode.
process.env.NODE_ENV = 'test';

const { describe } = require('node:test');
const request = require('supertest');
const app = require('../app');
const db = require('../db');

const createData = require('../_test_data')

let company;
let invoice;

beforeEach(async () => {
    const compResult = await db.query(`INSERT INTO companies (code, name, description) VALUES ('atari', 'Atari', 'video game OG') RETURNING code, name, description`)
    const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('atari', '2000') RETURNING id, comp_code, amt, paid, add_date, paid_date`)
    company = compResult.rows[0];
    invoice = invoiceResult.rows[0];
    console.log(invoice)
})

// beforeEach(async () => {
//     createData()
// })

afterEach(async () => {
    // await db.query('DELETE FROM companies JOIN invoices ON companies.code = invoices.comp_code WHERE company.code = "atari"')
    await db.query('DELETE FROM companies')
        .then(await db.query('DELETE FROM invoices'))
})

afterAll(async () => {
    await db.end();
})

// describe("GET /", function () {

//     test("It should respond with array of invoices", async function () {
//         const response = await request(app).get("/invoices");
//         expect(response.body).toEqual({
//             "invoices": [
//                 { id: 1, comp_code: "apple" },
//                 { id: 2, comp_code: "apple" },
//                 { id: 3, comp_code: "ibm" },
//             ]
//         });
//     })

// });


describe('GET /invoices', () => {
    test('Get all invoices', async () => {
        const response = await request(app).get('/invoices')
        expect(response.statusCode).toBe(200)
        expect(response.body).toEqual({ "invoices": [{ "comp_code": invoice.comp_code, "id": invoice.id }] })
    })
})

// describe('GET /invoices/:id', () => {
//     test('Get invoice by id', async () => {
//         const response = await request(app).get(`/invoices/${invoice.id}`)
//         expect(response.statusCode).toBe(200);
//         expect(response.body).toEqual(invoice)
//     })
// })
