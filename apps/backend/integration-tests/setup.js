// Setup file referenced by jest.config.js. Intentionally minimal.
// API key + user collection now live in the payload_integration_settings
// table; integration tests upsert them in beforeAll via the module service.
process.env.PAYLOAD_SERVER_URL = process.env.PAYLOAD_SERVER_URL || "http://127.0.0.1:0"
