// Tell Node that we're in test "mode"
// by default node is not in a test mode.
process.env.NODE_ENV = 'test';

const { describe } = require('node:test');
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let company;
let invoice;
let industry;
const testInvoice = { "comp_code": "microsoft", "amt": 200, "paid": false, "add_date": '2020-01-01', "paid_date": null }

beforeEach(async () => {
    const compResult = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('atari', 'Atari', 'video game OG') 
        RETURNING code, name, description
        `)
    const compForTesting = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('microsoft', 'Microsoft', 'Software giant') 
        RETURNING code, name, description
        `)
    const invoiceResult = await db.query(`
        INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) 
        VALUES ('atari', '2000', false, '2020-01-01', null) 
        RETURNING id, comp_code, amt, paid, add_date, paid_date`)
    const industryResults = await db.query(`
        INSERT INTO industries (ind_code, ind_name) 
        VALUES ('tech', 'Technology')
        RETURNING ind_code, ind_name
        `)
    const compIndRelation = await db.query(`
        INSERT INTO comp_industries (c_code, i_code)
        VALUES ('atari', 'tech')
        RETURNING c_code, i_code
        `)
    company = compResult.rows[0];
    invoice = invoiceResult.rows[0];
    industry = industryResults.rows[0]
})


afterEach(async () => {
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM invoices')
    await db.query('DELETE FROM industries')
    await db.query('DELETE FROM comp_industries')
})

afterAll(async () => {
    await db.end();
})
// it is easier to work with date objects if we pass them in as strings. 
// id can change when we run test, so checking for any number in return is better for testing. 
describe('GET /invoices', () => {
    test('Get all invoices', async () => {
        const response = await request(app).get('/invoices')
        expect(response.statusCode).toBe(200)
        const { amt, comp_code, paid, paid_date } = invoice;
        expect(response.body).toEqual({
            "invoices": [{ amt, comp_code, paid, paid_date, "id": expect.any(Number), "add_date": "2020-01-01T06:00:00.000Z" }]
        })
    })
})


describe('GET /invoices/:id', () => {
    test('Get invoice by id', async () => {
        const response = await request(app).get(`/invoices/${invoice.id}`)
        expect(response.statusCode).toBe(200);
        const { comp_code, amt, paid, paid_date } = invoice;
        const { code, name, description } = company;
        expect(response.body).toEqual({
            "invoice": { amt, paid, paid_date, "id": expect.any(Number), "add_date": "2020-01-01T06:00:00.000Z" },
            "company": { code, name, description }
        })
    })
})

describe('POST /invoices', () => {
    test('Post new invoice', async () => {
        const results = await request(app).post('/invoices').send(testInvoice)
        expect(results.status).toBe(201);
        const { amt, comp_code, paid, paid_date } = testInvoice;
        expect(results.body).toEqual({ "invoice": { amt, comp_code, paid, paid_date, "id": expect.any(Number), "add_date": "2020-01-01T06:00:00.000Z" } })
    })
})

describe('PATCH /invoices/:id', () => {
    test('Update existing invoice', async () => {
        const response = await request(app).patch(`/invoices/${invoice.id}`).send({ amt: 500, paid: true })
        expect(response.statusCode).toBe(200);
        const { comp_code, amt, paid, paid_date } = invoice;
        expect(response.body).toEqual({ "invoice": { comp_code, amt: 500, paid: true, paid_date, "id": expect.any(Number), "add_date": "2020-01-01T06:00:00.000Z" } })
    })
    // id, comp_code, amt, paid, add_date, paid_date
    test('Get 404 error when passing wrong id', async () => {
        const response = await request(app).patch(`/companies/tesla`).send({ name: "Tesla", description: "Technology innovation leader" })
        expect(response.statusCode).toBe(404);
    })
})

describe('DELETE /invoices/:id', () => {
    test('Delete invoice using id', async () => {
        const response = await request(app).delete(`/invoices/${invoice.id}`)
        expect(response.statusCode).toBe(200);
    })
    test('Get 404 code when entering wrong id', async () => {
        const response = await request(app).delete('/invoices/1030')
    })
})