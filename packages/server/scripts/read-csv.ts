import fs from 'fs'

import csvParser from 'csv-parser'
import sqlite3 from 'better-sqlite3'
// import 'log-buffer'

const db = sqlite3('assets/sentence.db')

async function uploadSentence (): Promise<Set<number>> {
  return new Promise((resolve, reject) => {
    const langs = new Set<string>(['cmn', 'jpn', 'eng'])
    const ids = new Set<number>()
    const ss: any[] = []

    const insert = db.prepare(/*sql*/`
    INSERT INTO sentence (id, lang, [text]) VALUES (@id, @lang, @text)
    `)
    const insertMany = db.transaction((rs) => {
      for (const r of rs) {
        insert.run(r)
      }
    })

    fs.createReadStream('/Users/patarapolw/Downloads/sentences.csv', 'utf8')
      .pipe(csvParser({
        separator: '\t',
        headers: ['tatoebaId', 'lang', 'text']
      }))
      .on('data', ({ tatoebaId, lang, text }) => {
        const id = parseInt(tatoebaId)

        if (langs.has(lang)) {
          ids.add(id)

          ss.push({ id, lang, text })

          if (ss.length > 1000) {
            const s = ss.splice(0, 1000)
            insertMany(s)
          }
        }
      })
      .on('end', async () => {
        insertMany(ss)
        resolve(ids)
      })
      .on('error', reject)
  })
}

export async function uploadTranslation (ids: Set<number>) {
  const idMap = new Map<number, number[]>()
  Array.from(ids).map((id) => { idMap.set(id, []) })

  const update = db.prepare(/*sql*/`
  UPDATE sentence SET translationIds = @translationIds WHERE id = @id
  `)
  const updateMany = db.transaction((rs) => {
    for (const [id, translationIds] of rs) {
      update.run({ translationIds: JSON.stringify(translationIds), id })
    }
  })

  return new Promise((resolve, reject) => {
    fs.createReadStream('/Users/patarapolw/Downloads/links.csv', 'utf8')
      .pipe(csvParser({
        separator: '\t',
        headers: ['sentenceId', 'translationId']
      }))
      .on('data', ({ sentenceId, translationId }) => {
        const sid = parseInt(sentenceId)
        const tid = parseInt(translationId)

        if (idMap.has(sid) && idMap.has(tid)) {
          const arr = idMap.get(sid)!
          arr.push(tid)
          idMap.set(sid, arr)
        }
      })
      .on('end', async () => {
        for (const ss of chunks(Array.from(idMap), 1000)) {
          updateMany(ss)
        }

        resolve()
      })
      .on('error', reject)
  })
}

export async function uploadTag (ids: Set<number>) {
  const idMap = new Map<number, string[]>()
  Array.from(ids).map((id) => { idMap.set(id, []) })
  const update = db.prepare(/*sql*/`
  UPDATE sentence SET tags = @tags WHERE id = @id
  `)
  const updateMany = db.transaction((rs) => {
    for (const [id, tags] of rs) {
      update.run({ tags: JSON.stringify(tags), id })
    }
  })

  return new Promise((resolve, reject) => {
    fs.createReadStream('/Users/patarapolw/Downloads/tags.csv', 'utf8')
      .pipe(csvParser({
        separator: '\t',
        headers: ['sentenceId', 'tagName']
      }))
      .on('data', ({ sentenceId, tagName }) => {
        const sid = parseInt(sentenceId)

        if (idMap.has(sid)) {
          const arr = idMap.get(sid)!
          arr.push(tagName)
          idMap.set(sentenceId, arr)
        }
      })
      .on('end', async () => {
        for (const ss of chunks(Array.from(idMap), 1000)) {
          updateMany(ss)
        }

        resolve()
      })
      .on('error', reject)
  })
}

export async function main () {
  db.exec(/*sql*/`
  CREATE TABLE IF NOT EXISTS sentence (
    id      INTEGER PRIMARY KEY,
    lang    TEXT NOT NULL,
    [text]  TEXT NOT NULL,
    translationIds  TEXT,
    tags    TEXT
  );
  `)

  console.log('Table created.')

  const ids = await uploadSentence()
  console.log('Sentence uploaded.')

  await uploadTranslation(ids)
  console.log('Translation uploaded.')

  await uploadTag(ids)
  console.log('Tags uploaded.')

  db.close()
}

export function * chunks<T> (arr: T[], n: number) {
  for (let i = 0; i < arr.length; i += n) {
    yield arr.slice(i, i + n)
  }
}

if (require.main === module) {
  main()
}
