const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const db = require('../db');
const slugify = require('slugify');

// get all companies
router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`
        SELECT c.code, c.name, c.description, i.ind_code, i.ind_name
        FROM companies AS c
        LEFT JOIN comp_industries AS comp_i
        ON c.code = comp_i.c_code
        LEFT JOIN industries AS i
        ON comp_i.i_code = i.ind_code
        `)
        return res.status(200).json({ companies: results.rows })
    } catch (e) {
        return next(e)
    }
})

// get company info and invoices associated with the company
router.get('/:id', async (req, res, next) => {
    try {
        const results = await db.query('SELECT * FROM companies JOIN invoices ON companies.code = invoices.comp_code WHERE code=$1', [req.params.id]);
        if (results.rowCount === 0) {
            throw new ExpressError('Invalid entry', 404)
        }
        // if we have multiple invoices we can set them to an object that is added to invoiceArr
        // and then returned to use in JSON format.
        const invoiceArr = []
        results.rows.forEach(row => {
            const { id, amt, paid, add_date, paid_date } = row;
            invoiceArr.push({ id, amt, paid, add_date, paid_date })
        })
        // get company info
        const { code, name, description } = results.rows[0];
        return res.status(200).json({ companies: { code, name, description, invoices: invoiceArr } });
    } catch (e) {
        return next(e)
    }
})

// add new company to the companies db
router.post('/', async (req, res, next) => {
    try {
        const { name, description } = req.body;
        const comp_code = slugify(name, {
            replacement: '_',  // replace spaces with replacement character, defaults to `-`
            remove: undefined, // remove characters that match regex, defaults to `undefined`
            lower: true,      // convert to lower case, defaults to `false`
            strict: false,     // strip special characters except replacement, defaults to `false`
            locale: 'vi',      // language code of the locale to use
            trim: true         // trim leading and trailing replacement chars, defaults to `true`
        })
        const results = await db.query('INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description', [comp_code, name, description]);
        return res.status(201).json({ company: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

// update company 
router.patch('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const results = await db.query('UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description', [name, description, id])
        if (results.rowCount === 0) {
            throw new ExpressError('Invalid company id', 404)
        }
        return res.status(200).json({ company: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        const results = await db.query('DELETE FROM companies WHERE code=$1', [req.params.id]);
        // when deleting if entry is found the rowCount is equal to 1, as in one entry found
        // however when rowCount is equal to 0, that means no matching entries were found
        if (results.rowCount === 0) {
            throw new ExpressError('Invalid company id', 404);
        }
        return res.status(200).json({ status: "deleted" })
    } catch (e) {
        return next(e)
    }
})


module.exports = router;