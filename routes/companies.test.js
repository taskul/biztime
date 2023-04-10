// Tell Node that we're in test "mode"
// by default node is not in a test mode.
process.env.NODE_ENV = 'test';

const { describe } = require('node:test');
const request = require('supertest');
const app = require('../app');
const db = require('../db');

let company;
let invoice;
const muscleTech = { code: "muscletech", name: "MuscleTech", description: "Leader in supplement innovation" };

beforeEach(async () => {
    const compResult = await db.query(`INSERT INTO companies (code, name, description) VALUES ('atari', 'Atari', 'video game OG') RETURNING code, name, description`)
    const invoiceResult = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ('atari', '2000') RETURNING id, comp_code, amt, paid, add_date, paid_date`)
    company = compResult.rows[0];
    invoice = invoiceResult.rows[0];
})

afterEach(async () => {
    // await db.query('DELETE FROM companies JOIN invoices ON companies.code = invoices.comp_code WHERE company.code = "atari"')
    await db.query('DELETE FROM companies')
        .then(await db.query('DELETE FROM invoices'))
})

afterAll(async () => {
    await db.end();
})

describe('GET /companies', () => {
    test('Get a list of companies', async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ companies: [company] })
    });
})

describe('GET /companies/:id', () => {
    test('Get company based on id', async () => {
        const response = await request(app).get(`/companies/${company.code}`)
        const { code, name, description } = company;
        const { id, amt, paid, add_date, paid_date } = invoice;
        expect(response.statusCode).toBe(200);
        // expect(response.body).toEqual({ companies: { code, name, description, invoices: [{ id, amt, paid, add_date, paid_date }] } })
    })
    test('Get 404 error when entering wrong id', async () => {
        const response = await request(app).get('/companies/tesla')
        expect(response.statusCode).toBe(404)
    })
})

describe('POST /companies', () => {
    test('Add new company', async () => {
        const response = await request(app).post('/companies').send(muscleTech)
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual({ company: muscleTech })
    })
})

describe('PATCH /companies/:id', () => {
    test('Update existing company', async () => {
        const response = await request(app).patch(`/companies/${company.code}`).send({ name: "Atari Inc", description: "Gaming giant" })
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ company: { code: "atari", name: "Atari Inc", description: "Gaming giant" } })
    })
    test('Get 404 error when passing wrong id', async () => {
        const response = await request(app).patch(`/companies/tesla`).send({ name: "Tesla", description: "Technology innovation leader" })
        expect(response.statusCode).toBe(404);
    })
})

describe('DELETE /companies/:id', () => {
    test('Delete company using id', async () => {
        const response = await request(app).delete(`/companies/${company.code}`)
        expect(response.statusCode).toBe(200);
    })
    test('Get 404 code when entering wrong id', async () => {
        const response = await request(app).delete('/companies/tesla')
    })
})