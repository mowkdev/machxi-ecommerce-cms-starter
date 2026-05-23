import path from "path"

import type { NextConfig } from "next"
import { withPayload } from "@payloadcms/next/withPayload"
import createNextIntlPlugin from "next-intl/plugin"

import { checkEnvVariables } from "./check-env-variables"

checkEnvVariables()

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

const nextConfig: NextConfig = {
  // Standalone output: emits .next/standalone/apps/storefront/server.js with
  // a minimal node_modules, copied into the Docker runner stage.
  output: "standalone",
  // Tracing root — required in a monorepo so Next collects deps from the
  // workspace root rather than just apps/storefront/node_modules.
  outputFileTracingRoot: path.join(process.cwd(), "../.."),
  reactStrictMode: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "medusa-public-images.s3.eu-west-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "medusa-server-testing.s3.us-east-1.amazonaws.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https" as const,
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

export default withPayload(withNextIntl(nextConfig))
