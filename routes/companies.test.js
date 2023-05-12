const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies")
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computer', 'Maker of OSX.')
    RETURNING code, name, description`)

  testCompany = result.rows[0];
});

/** GET /companies - returns `{companies: [{code, name}, ...]}` */

describe("GET /companies", function () {
  test("Gets a list of companies", async function () {
    const resp = await request(app).get(`/companies`);

    expect(resp.body).toEqual({
      companies: [{
        code: testCompany.code,
        name: testCompany.name
      }]
    });
  });

  test("Gets a non-existent endpoint", async function () {
    const resp = await request(app).get(`/not-real`);

    expect(resp.statusCode).toEqual(404);
  });
});

/** GET /companies/:code - Return obj of company:
 * {company:
 *      {code, name, description,
 *      invoices: [id,...]
 *      }
 * } */

describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);

    expect(resp.body).toEqual({
      company:
      {
        code: testCompany.code, 
        name: testCompany.name, 
        description: testCompany.description,
        invoices: []
      }
    });
  });

  test("Gets a non-existent endpoint", async function () {
    const resp = await request(app).get(`/companies/not-real`);

    expect(resp.statusCode).toEqual(404);
  });
});

/** POST /companies - create company from data; 
 * return `{company: {code, name, description}}` */

describe("POST /companies", function() {
  it("Creates a new company", async function() {
    const resp = await request(app)
      .post(`/companies`)
      .send({
        code: "test",
        name: "test",
        description: "testing company"
      });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: {
        code: "test", 
        name: "test", 
        description: "testing company"}
    });
  });

  it("Fails to create duplicate", async function() {
    const resp = await request(app)
      .post(`/companies`)
      .send(testCompany);
    expect(resp.statusCode).toEqual(400);
  });

  it("Fails to create with empty body", async function() {
    const resp = await request(app)
      .post(`/companies`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});

/** PATCH /companies/:code - update company; 
 * return `{company: {code, name, description}}` */

describe("PATCH /companies/:code", function() {
  it("Updates a single company", async function() {
    const resp = await request(app)
      .patch(`/companies/${testCompany.code}`)
      .send({
        name: "updated name",
        description: "updated description"
      });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: { 
        code: "apple", 
        name: "updated name", 
        description: "updated description"
      }
    });
  });

  it("Responds with 400 if code invalid", async function() {
    const resp = await request(app).patch(`/companies/not-here`);
    expect(resp.statusCode).toEqual(400);
  });
});

/** DELETE /companies/:code - delete company,
 *  return `{status: "deleted"}` */

describe("DELETE /companies/:name", function() {
  it("Deletes a single a company", async function() {
    const resp = await request(app)
      .delete(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({ status: "deleted" });
  });
});