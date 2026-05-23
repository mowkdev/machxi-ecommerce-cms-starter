import { model } from "@medusajs/framework/utils"

const PayloadIntegrationSettings = model.define("payload_integration_settings", {
  id: model.id().primaryKey(),
  api_key: model.text(),
  user_collection: model.text().default("users"),
})

export default PayloadIntegrationSettings
