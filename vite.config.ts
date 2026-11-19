import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const plugins = [react(), tailwindcss()];
  if (process.env.CITEVERIFY_SOURCE_TAGS === 'true') {
    try {
      const pluginUrl = pathToFileURL(resolve(process.cwd(), '.vite-source-tags.js')).href
      const m = await import(/* @vite-ignore */ pluginUrl) as { sourceTags: () => (typeof plugins)[number] }
      plugins.push(m.sourceTags())
    } catch {
      console.warn('Optional source tagging is unavailable; continuing without it.')
    }
  }

  const env = loadEnv(mode, process.cwd(), ['VITE_', 'NEXT_PUBLIC_']);
  const processEnvDefines: Record<string, string> = {};
  for (const [key, value] of Object.entries(env)) {
    processEnvDefines[`process.env.${key}`] = JSON.stringify(value);
  }

  return {
    // The repository is published from a project Pages path, so bundle URLs
    // must remain relative to the deployed repository directory.
    base: './',
    plugins,
    envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
    define: processEnvDefines,
  };
})
