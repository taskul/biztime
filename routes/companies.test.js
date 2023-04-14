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
const muscleTech = { code: "muscletech", name: "MuscleTech", description: "Leader in supplement innovation" };

beforeEach(async () => {
    const compResult = await db.query(`
        INSERT INTO companies (code, name, description) 
        VALUES ('atari', 'Atari', 'video game OG') 
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
    // await db.query('DELETE FROM companies JOIN invoices ON companies.code = invoices.comp_code WHERE company.code = "atari"')
    await db.query('DELETE FROM companies')
    await db.query('DELETE FROM invoices')
    await db.query('DELETE FROM industries')
    await db.query('DELETE FROM comp_industries')
})

afterAll(async () => {
    await db.end();
})

describe('GET /companies', () => {
    test('Get a list of companies', async () => {
        const response = await request(app).get('/companies');
        expect(response.statusCode).toBe(200);
        const { code, name, description } = company;
        const { ind_code, ind_name } = industry;
        expect(response.body).toEqual({ companies: [{ code, name, description, ind_code, ind_name }] });
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