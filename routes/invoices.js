"use strict";

const express = require("express");

const {
    ExpressError,
    NotFoundError,
    UnauthorizedError,
    BadRequestError,
    ForbiddenError,
} = require("../expressError");

const db = require("../db");
const app = require("../app");
const router = new express.Router();


/**GET /invoices 
 * Return info on invoices: like {invoices: [{id, comp_code}, ...]}
 */

router.get('/', async function (req, res, next) {
    const result = await db.query(`
        SELECT id, comp_code
            FROM invoices`
    );
    const invoices = result.rows;

    return res.json({ invoices });
});

/**GET /invoices/[id]
 * Returns obj on given invoice.
 * If invoice cannot be found, returns 404.
 * 
 * Returns:
 * {invoice: {id, amt, paid, add_date, paid_date, 
 * company: {code, name, description}}
 */

router.get('/:id', async function (req, res, next) {
    const resultInvoice = await db.query(`
        SELECT *
            FROM invoices
            WHERE id = $1`,
        [req.params.id]
    );

    const invoice = resultInvoice.rows[0];
    
    if(!invoice) {
        throw new NotFoundError();
    }

    const compCode = invoice.comp_code;
    delete invoice.comp_code;

    const resultCompany = await db.query(`
        SELECT code, name, description
            FROM companies
            WHERE code = $1`,
        [compCode]
    );

    const company = resultCompany.rows[0];

    invoice.company = company;

    return res.json({ invoice });
});


/**POST /invoices  Adds an invoice
 * Needs to be passed in JSON body of: {comp_code, amt}
 * Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.post('/', async function (req, res, next) {
    if (!req.body) throw new BadRequestError();

    const { comp_code, amt } = req.body;
  
    const checkCompany = await db.query(`
        SELECT code, name, description
            FROM companies
            WHERE code = $1`,
        [comp_code]
    );

    const checkExist = checkCompany.rows[0]

    if (!checkExist) {
        throw new BadRequestError();
    }
    
    const result = await db.query(`
        INSERT INTO invoices (comp_code, amt)
            VALUES ($1 , $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [comp_code, amt]
    );

    const invoice = result.rows[0];

    return res.status(201).json({ invoice });
});

module.exports = router;
