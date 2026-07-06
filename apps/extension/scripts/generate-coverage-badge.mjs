#!/usr/bin/env node
// Renders a shields.io-style flat SVG badge from vitest's coverage-summary.json — no network
// calls, no third-party badge service, no new dependency. Run after `vitest run --coverage`
// (which must include the `json-summary` reporter).

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const extensionDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const summaryPath = path.join(extensionDir, 'coverage', 'coverage-summary.json')
const outputPath = path.join(extensionDir, 'coverage-badge.svg')

const summary = JSON.parse(readFileSync(summaryPath, 'utf-8'))
const pct = summary.total.lines.pct
const label = 'coverage'
const value = `${pct}%`

const color = pct >= 80 ? '#4c1' : pct >= 60 ? '#dfb317' : pct >= 40 ? '#fe7d37' : '#e05d44'

// Rough monospace-ish width estimate (~6.5px/char at the font-size used below), matching the
// proportions of shields.io's classic flat badge style closely enough for a README image.
const charWidth = 6.5
const padding = 10
const labelWidth = Math.round(label.length * charWidth + padding * 2)
const valueWidth = Math.round(value.length * charWidth + padding * 2)
const totalWidth = labelWidth + valueWidth

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${color}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>
`

writeFileSync(outputPath, svg)
console.log(`Wrote ${outputPath} (${value})`)
