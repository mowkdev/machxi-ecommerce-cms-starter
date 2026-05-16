import c from "ansi-colors"

type RequiredEnv = {
  key: string
  description?: string
}

const requiredEnvs: RequiredEnv[] = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    description:
      "Learn how to create a publishable key: https://docs.medusajs.com/resources/storefront-development/publishable-api-keys",
  },
  {
    key: "MEDUSA_BACKEND_URL",
    description:
      "Set the URL of your Medusa backend (e.g. http://localhost:9000). See https://docs.medusajs.com/learn/configurations/medusa-config#httpstorecors",
  },
]

export function checkEnvVariables(): void {
  const missingEnvs = requiredEnvs.filter((env) => !process.env[env.key])

  if (missingEnvs.length === 0) {
    return
  }

  console.error(
    c.red.bold("\n🚫 Error: Missing required environment variables\n")
  )

  missingEnvs.forEach((env) => {
    console.error(c.yellow(`  ${c.bold(env.key)}`))
    if (env.description) {
      console.error(c.dim(`    ${env.description}\n`))
    }
  })

  console.error(
    c.yellow(
      "\nPlease set these variables in your .env file or environment before starting the application.\n"
    )
  )

  process.exit(1)
}

export default checkEnvVariables
