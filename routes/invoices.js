const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError')
const db = require('../db');

// get all invoices
router.get('/', async (req, res, next) => {
    const response = await db.query('SELECT * FROM invoices ORDER BY id');
    return res.status(200).json({ "invoices": response.rows })
})

// get invice by id
router.get('/:id', async (req, res, next) => {
    try {
        // when using SELECT we get values back, otherwise use RETURNING
        const response = await db.query('SELECT * FROM invoices JOIN companies ON invoices.comp_code = companies.code WHERE id=$1', [req.params.id])
        if (response.rowCount === 0) {
            throw new ExpressError('Invlalid invoice id', 404)
        }
        const { id, amt, paid, add_date, paid_date, code, name, description } = response.rows[0];
        return res.status(200).json({ invoice: { id, amt, paid, add_date, paid_date }, company: { code, name, description } })
    } catch (e) {
        return next(e)
    }
})

// create new invoice that will accept comp_code, amt in json object, add_date will be added automatically.
router.post('/', async (req, res, next) => {
    let response;
    const { comp_code, amt, add_date } = req.body;
    if (add_date) {
        response = await db.query(`
            INSERT INTO invoices (comp_code, amt, add_date) 
            VALUES ($1, $2, $3) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt, add_date])
    } else {
        // when using SELECT we get values back, otherwise use RETURNING
        response = await db.query(`
            INSERT INTO invoices (comp_code, amt) 
            VALUES ($1, $2) 
            RETURNING id, comp_code, amt, paid, add_date, paid_date`, [comp_code, amt])
    }
    return res.status(201).json({ invoice: response.rows[0] });
})

// update invoice amount
router.patch('/:id', async (req, res, next) => {
    try {
        // when using SELECT we get values back, otherwise use RETURNING
        const { id } = req.params;
        const { amt, paid } = req.body;
        const response = await db.query('UPDATE invoices SET amt=$1, paid=$2 WHERE id=$3 RETURNING id, comp_code, amt, paid, add_date, paid_date', [amt, paid, id])
        if (response.rowCount === 0) {
            throw new ExpressError('Invalid invoice id', 404)
        }
        return res.status(200).json({ invoice: response.rows[0] })
    } catch (e) {
        return next(e)
    }
})

// delete invoice using id
router.delete('/:id', async (req, res, next) => {
    try {
        const response = await db.query('DELETE FROM invoices WHERE id=$1', [req.params.id]);
        if (response.rowCount === 0) {
            throw new ExpressError('Invalid invoice id', 404)
        }
        return res.status(200).json({ status: "deleted" })
    } catch (e) {
        return next(e)
    }
})

module.exports = router;