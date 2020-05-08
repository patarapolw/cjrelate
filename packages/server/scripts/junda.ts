import fs from 'fs'

import csvParser from 'csv-parser'
import sqlite3 from 'better-sqlite3'
import 'log-buffer'

async function main () {
  const db = sqlite3('assets/junda.db')

  db.exec(/*sql*/`
  CREATE TABLE hanzi (
    id          INTEGER PRIMARY KEY,
    [character] TEXT NOT NULL UNIQUE,
    raw_freq    REAL,
    percentile  REAL,
    pinyin      TEXT NOT NULL,
    english     TEXT
  );
  `)

  const ss: any[] = []

  const insert = db.prepare(/*sql*/`
  INSERT INTO hanzi (id, [character], raw_freq, percentile, pinyin, english)
  VALUES (@id, @character, @raw_freq, @percentile, @pinyin, @english)
  `)
  const insertMany = db.transaction((rs) => {
    for (const r of rs) {
      r.id = parseInt(r.id)
      r.raw_freq = parseFloat(r.raw_freq)
      r.percentile = parseFloat(r.percentile)

      insert.run(r)
    }
  })

  return new Promise((resolve, reject) => {
    fs.createReadStream('/Users/patarapolw/Downloads/CharFreq.txt', 'utf8')
      .pipe(csvParser({
        separator: '\t',
        headers: ['id', 'character', 'raw_freq', 'percentile', 'pinyin', 'english']
      }))
      .on('data', (r) => {
        ss.push(r)

        if (ss.length > 1000) {
          const s = ss.splice(0, 1000)
          insertMany(s)
        }
      })
      .on('end', async () => {
        insertMany(ss)
        resolve()
      })
      .on('error', reject)
  })
}

if (require.main === module) {
  main()
}
