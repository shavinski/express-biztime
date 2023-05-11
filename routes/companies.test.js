const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function(){
  await db.query("DELETE FROM companies")
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
    RETURNING code, name, description`)

  testCompany = result.rows[0]

});