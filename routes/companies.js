"use strict"

const express = require("express");

const db = require("../db");
const app = require("../app");
const router = new express.Router();

/** GET /companies 
 * Returns list of companies, like: {companies: [{code, name}, ...]} 
*/

router.get('/', function(req, res) {
    const result = db.query(`
        SELECT code, name
        FROM companies`);
    const companies = result.rows;

    return res.json({ companies });
})


module.exports = router;