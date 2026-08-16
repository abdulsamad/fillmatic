import { execFileSync } from 'node:child_process'
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const outputDirectory = resolve(scriptDirectory, '../public/samples')
const fixedDate = new Date('2026-08-16T00:00:00Z')

mkdirSync(outputDirectory, { recursive: true })

const writeFixture = (filename, content) => {
  const outputPath = join(outputDirectory, filename)
  writeFileSync(outputPath, content)
  chmodSync(outputPath, 0o644)
  utimesSync(outputPath, fixedDate, fixedDate)
}

const runFfmpeg = (args) => {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], {
    stdio: 'inherit',
  })
}

const stripJpegComments = (filePath) => {
  const input = readFileSync(filePath)
  const chunks = [input.subarray(0, 2)]
  let offset = 2

  while (offset < input.length) {
    if (input[offset] !== 0xff) throw new Error(`Invalid JPEG marker at byte ${offset}`)

    const marker = input[offset + 1]
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(input.subarray(offset))
      break
    }

    const segmentLength = input.readUInt16BE(offset + 2)
    const segmentEnd = offset + 2 + segmentLength
    if (marker !== 0xfe) chunks.push(input.subarray(offset, segmentEnd))
    offset = segmentEnd
  }

  writeFileSync(filePath, Buffer.concat(chunks))
}

const escapePdfText = (value) => value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)')

const createPdf = () => {
  const content = [
    'q',
    '0.31 0.27 0.90 rg',
    '72 620 468 8 re f',
    'Q',
    'BT',
    '/F1 22 Tf',
    '0.06 0.06 0.10 rg',
    '72 700 Td',
    `(${escapePdfText('FillMatic PDF Upload Fixture')}) Tj`,
    '0 -38 Td',
    '/F1 11 Tf',
    `(${escapePdfText('Synthetic content generated for file-input testing.')}) Tj`,
    '0 -18 Td',
    `(${escapePdfText('No personal data or third-party creative material.')}) Tj`,
    'ET',
  ].join('\n')

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`,
    '<< /Title (FillMatic PDF Upload Fixture) /Author (FillMatic Contributors) /Creator (FillMatic Fixture Generator) /Producer (FillMatic Fixture Generator) /CreationDate (D:20260816000000Z) /ModDate (D:20260816000000Z) >>',
  ]

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const offsets = [0]

  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf, 'binary'))
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`
  }

  const xrefOffset = Buffer.byteLength(pdf, 'binary')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

  writeFixture('sample.pdf', Buffer.from(pdf, 'binary'))
}

const createDocx = () => {
  const stagingDirectory = mkdtempSync(join(tmpdir(), 'fillmatic-docx-'))
  const documentDirectory = join(stagingDirectory, 'word')
  const documentRelationshipsDirectory = join(documentDirectory, '_rels')
  const packageRelationshipsDirectory = join(stagingDirectory, '_rels')
  const propertiesDirectory = join(stagingDirectory, 'docProps')

  mkdirSync(documentRelationshipsDirectory, { recursive: true })
  mkdirSync(packageRelationshipsDirectory, { recursive: true })
  mkdirSync(propertiesDirectory, { recursive: true })

  const files = new Map([
    [
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`,
    ],
    [
      '_rels/.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`,
    ],
    [
      'docProps/core.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>FillMatic DOCX Upload Fixture</dc:title>
  <dc:subject>Synthetic file-input test fixture</dc:subject>
  <cp:keywords>FillMatic; synthetic; fixture</cp:keywords>
  <dcterms:created xsi:type="dcterms:W3CDTF">2026-08-16T00:00:00Z</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">2026-08-16T00:00:00Z</dcterms:modified>
</cp:coreProperties>`,
    ],
    [
      'docProps/app.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>FillMatic Fixture Generator</Application>
  <AppVersion>1.0</AppVersion>
  <Pages>1</Pages>
  <Words>19</Words>
</Properties>`,
    ],
    [
      'word/_rels/document.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    ],
    [
      'word/styles.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault>
    <w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/>
    <w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="320" w:after="160"/><w:outlineLvl w:val="0"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:b/><w:color w:val="2E74B5"/><w:sz w:val="32"/><w:szCs w:val="32"/></w:rPr>
  </w:style>
</w:styles>`,
    ],
    [
      'word/document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>FillMatic DOCX Upload Fixture</w:t></w:r></w:p>
    <w:p><w:r><w:t>Synthetic content generated for file-input testing.</w:t></w:r></w:p>
    <w:p><w:r><w:t>No personal data or third-party creative material.</w:t></w:r></w:p>
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
      <w:cols w:space="708"/><w:docGrid w:linePitch="360"/>
    </w:sectPr>
  </w:body>
</w:document>`,
    ],
  ])

  try {
    for (const [relativePath, content] of files) {
      const absolutePath = join(stagingDirectory, relativePath)
      mkdirSync(dirname(absolutePath), { recursive: true })
      writeFileSync(absolutePath, content)
      chmodSync(absolutePath, 0o644)
      utimesSync(absolutePath, fixedDate, fixedDate)
    }

    const outputPath = join(outputDirectory, 'sample.docx')
    rmSync(outputPath, { force: true })
    execFileSync(
      'zip',
      [
        '-X',
        '-q',
        outputPath,
        '[Content_Types].xml',
        '_rels/.rels',
        'docProps/core.xml',
        'docProps/app.xml',
        'word/_rels/document.xml.rels',
        'word/styles.xml',
        'word/document.xml',
      ],
      { cwd: stagingDirectory, stdio: 'inherit' },
    )
    chmodSync(outputPath, 0o644)
    utimesSync(outputPath, fixedDate, fixedDate)
  } finally {
    rmSync(stagingDirectory, { recursive: true, force: true })
  }
}

writeFixture('sample.txt', 'FillMatic plain-text upload fixture.\nSynthetic content only; no personal data.\n')

writeFixture('sample.csv', 'fixture_id,category,status\nFM-001,synthetic,ready\nFM-002,synthetic,ready\n')

writeFixture(
  'sample.html',
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FillMatic HTML Upload Fixture</title>
  </head>
  <body>
    <main>
      <h1>FillMatic HTML Upload Fixture</h1>
      <p>Synthetic content only; no personal data or third-party assets.</p>
    </main>
  </body>
</html>
`,
)

writeFixture(
  'sample.doc',
  String.raw`{\rtf1\ansi\deff0{\fonttbl{\f0 Calibri;}}\paperw12240\paperh15840\margl1440\margr1440\margt1440\margb1440{\f0\fs32\b FillMatic DOC Upload Fixture}\par\fs22\b0 Synthetic content generated for file-input testing.\par No personal data or third-party creative material.\par}`,
)

createDocx()
createPdf()

runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  'color=c=0x4F46E5:s=320x180:d=1',
  '-vf',
  'drawgrid=w=40:h=40:t=2:c=0xA5B4FC@0.45',
  '-frames:v',
  '1',
  '-threads',
  '1',
  '-map_metadata',
  '-1',
  join(outputDirectory, 'sample.png'),
])

runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  'color=c=0x4F46E5:s=320x180:d=1',
  '-vf',
  'drawgrid=w=40:h=40:t=2:c=0xA5B4FC@0.45',
  '-frames:v',
  '1',
  '-q:v',
  '3',
  '-map_metadata',
  '-1',
  join(outputDirectory, 'sample.jpg'),
])
stripJpegComments(join(outputDirectory, 'sample.jpg'))

runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  'testsrc2=duration=1:size=320x180:rate=10',
  '-vf',
  'fps=10,scale=320:180:flags=lanczos',
  '-loop',
  '0',
  '-map_metadata',
  '-1',
  join(outputDirectory, 'sample.gif'),
])

runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=660:duration=1:sample_rate=44100',
  '-c:a',
  'aac',
  '-b:a',
  '96k',
  '-map_metadata',
  '-1',
  join(outputDirectory, 'sample.aac'),
])

runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  'sine=frequency=660:duration=1:sample_rate=44100',
  '-c:a',
  'libmp3lame',
  '-b:a',
  '96k',
  '-map_metadata',
  '-1',
  '-write_xing',
  '0',
  '-id3v2_version',
  '0',
  join(outputDirectory, 'sample.mp3'),
])

runFfmpeg([
  '-f',
  'lavfi',
  '-i',
  'testsrc2=duration=1:size=320x180:rate=15',
  '-an',
  '-c:v',
  'libx264',
  '-preset',
  'medium',
  '-crf',
  '23',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  '-map_metadata',
  '-1',
  join(outputDirectory, 'sample.mp4'),
])

for (const filename of ['sample.png', 'sample.jpg', 'sample.gif', 'sample.aac', 'sample.mp3', 'sample.mp4']) {
  const outputPath = join(outputDirectory, filename)
  chmodSync(outputPath, 0o644)
  utimesSync(outputPath, fixedDate, fixedDate)
}

console.log(`Generated 12 synthetic sample files in ${outputDirectory}`)
