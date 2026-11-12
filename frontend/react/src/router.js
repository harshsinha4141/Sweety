import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

// routeTree.gen.js is generated automatically from the files in src/routes — don't edit it.
export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  scrollRestoration: true,
})
