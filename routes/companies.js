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



/** GET /companies
 * Returns list of companies, like: {companies: [{code, name}, ...]}
*/

router.get('/', async function (req, res, next) {
    const result = await db.query(`
        SELECT code, name
            FROM companies`
    );
    const companies = result.rows;

    return res.json({ companies });
});

/** GET /companies/[code]
 * Return obj of company:
 * {company:
 *      {code, name, description,
 *      invoices: [id,...]
 *      }
 * }
 */

router.get('/:code', async function (req, res, next) {

    const code = req.params.code;

    const companyResult = await db.query(`
        SELECT code, name, description
            FROM companies
            WHERE code = $1`,
        [code]
    );

    const company = companyResult.rows[0];

    if (!company) {
        throw new NotFoundError();
    }

    const invoicesResult = await db.query(`
        SELECT comp_code, id
            FROM invoices
            WHERE comp_code = $1`,
        [code]
    );

    const invoices = invoicesResult.rows;

    company.invoices = invoices.map(invoice => invoice.id);

    return res.json({ company });
});

/**
 * POST /companies Adds a company.
 * Accepts JSON like: {code, name, description}
 * Returns obj of new company: {company: {code, name, description}}
 */

router.post('/', async function (req, res, next) {
    if (!req.body) throw new BadRequestError();

    const { code, name, description } = req.body;

    if(!code || !name || !description) {
        throw new BadRequestError();
    }

    let result;

    try {
        result = await db.query(`
        INSERT INTO companies (code, name, description)
            VALUES ($1 , $2, $3)
            RETURNING code, name, description`,
        [code, name, description]);
    } catch(err) {
        if (err.message.includes('duplicate key')) {
            throw new BadRequestError();
        }
    }

    const company = result.rows[0];

    return res.status(201).json({ company });
});

/**
 * PATCH /companies Edit a company.
 * Accepts JSON like: {name, description}
 * Returns obj of updates company: {company: {code, name, description}}
 */

router.patch('/:code', async function (req, res, next) {
    if (!req.body) throw new BadRequestError();

    const code = req.params.code;
    const { name, description } = req.body;

    const result = await db.query(`
        UPDATE companies
            SET name=$2,
                description=$3
            WHERE code = $1
            RETURNING code, name, description`,
        [code, name, description]
    );

    const company = result.rows[0];

    if (!company) {
        throw new NotFoundError();
    }

    return res.json({ company });
});

/**
 * Deletes company.
 * Should return 404 if company cannot be found.
 */

router.delete('/:code', async function (req, res, next) {

    const code = req.params.code;

    const result = await db.query(`
        DELETE FROM companies
            WHERE code = $1
            RETURNING *`,
        [code]
    );

    const company = result.rows[0];

    if (!company) {
        throw new NotFoundError();
    }

    return res.json({ status: "deleted" });
});

module.exports = router;