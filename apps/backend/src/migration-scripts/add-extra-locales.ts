import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"

// Locales the @medusajs/medusa/translation module's `defaults` loader
// doesn't ship (see @medusajs/translation/dist/loaders/defaults.js).
// Re-run safely; the script skips codes that already exist.
const EXTRA_LOCALES = [
  { code: "lv-LV", name: "Latvian (Latvia)" },
] as const

export default async function addExtraLocales({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const translationService = container.resolve(Modules.TRANSLATION)

  const codes = EXTRA_LOCALES.map((l) => l.code)
  const existing = await translationService.listLocales({ code: codes })
  const existingCodes = new Set(existing.map((l) => l.code))

  const toCreate = EXTRA_LOCALES.filter((l) => !existingCodes.has(l.code))
  if (toCreate.length === 0) {
    logger.info(
      `add-extra-locales: all ${EXTRA_LOCALES.length} locale(s) already exist, nothing to do`
    )
    return
  }

  const created = await translationService.createLocales([...toCreate])
  logger.info(
    `add-extra-locales: created ${created.length} locale(s): ${created
      .map((l) => l.code)
      .join(", ")}`
  )
}
