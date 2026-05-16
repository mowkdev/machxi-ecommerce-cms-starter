// Setup file referenced by jest.config.js. Intentionally minimal.
process.env.PAYLOAD_SERVER_URL = process.env.PAYLOAD_SERVER_URL || "http://127.0.0.1:0"
process.env.PAYLOAD_API_KEY = process.env.PAYLOAD_API_KEY || "test-key"
process.env.PAYLOAD_USER_COLLECTION = process.env.PAYLOAD_USER_COLLECTION || "users"
