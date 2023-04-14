const express = require('express');
const router = express.Router();
const ExpressError = require('../expressError');
const db = require('../db');

router.get('/', async (req, res, next) => {
    try {
        const results = await db.query(`
            SELECT i.ind_code, i.ind_name, c.code
            FROM industries AS i
            LEFT JOIN comp_industries AS comp_i
            ON i.ind_code = comp_i.i_code
            LEFT JOIN companies AS c
            ON comp_i.c_code = c.code
            `)
        return res.status(200).json(results.rows)
    } catch (e) {
        return next(e)
    }
})

router.post('/', async (req, res, next) => {
    try {
        const { ind_code, ind_name } = req.body;
        const results = await db.query(`
            INSERT INTO industries (ind_code, ind_name) 
            VALUES ($1, $2)
            RETURNING ind_code, ind_name
            `, [ind_code, ind_name])
        return res.status(201).json({ industry: results.rows[0] })
    } catch (e) {
        return next(e)
    }
})

module.exports = router;