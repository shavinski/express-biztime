"use strict"

const express = require("express");

const db = require("../db");
const app = require("../app");
const router = new express.Router();

/** GET /companies 
 * Returns list of companies, like: {companies: [{code, name}, ...]} 
*/

router.get('/', async function(req, res) {
    const result = await db.query(`
        SELECT code, name
        FROM companies`);
    const companies = result.rows;

    return res.json({ companies });
});

/** GET /companies/[code] 
 * Return obj of company: {company: {code, name, description}}
 */ 
router.get('/:code', async function (req, res) {
    const result = await db.query(`
    SELECT code, name, description
    FROM companies
    WHERE code = $1`,
    [req.params.code]);

    const company = result.rows[0];  

    return res.json({ company })
})


module.exports = router;