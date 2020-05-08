import sqlite3 from 'better-sqlite3'

async function main () {
  const newDb = sqlite3('assets/cedict.db')
  newDb.exec(/*sql*/`
  CREATE TABLE vocab (
    simplified  TEXT NOT NULL,
    traditional TEXT,
    pinyin      TEXT NOT NULL,
    english     TEXT NOT NULL,
    rating      REAL,
    UNIQUE (simplified, traditional, pinyin)
  )
  `)

  const insert = newDb.prepare(/*sql*/`
  INSERT INTO vocab (simplified, traditional, pinyin, english)
  VALUES (@simplified, @traditional, @pinyin, @english)
  `)
  const insertMany = newDb.transaction((rs: any[]) => {
    for (const r of rs) {
      insert.run(r)
    }
  })

  const db = sqlite3('/Users/patarapolw/projects/zhquiz/packages/server/assets/zh.db')
  const ss: any[] = []
  let i = 0

  for (const r of db.prepare(/*sql*/`
  SELECT simplified, traditional, pinyin, english FROM vocab
  `).iterate()) {
    ss.push(r)

    if (ss.length > 1000) {
      const s = ss.splice(0, 1000)
      insertMany(s)
      console.log('inserting', i++)
    }
  }

  if (ss.length > 0) {
    insertMany(ss)
  }
  console.log('done')

  db.close()
  newDb.close()
}

if (require.main === module) {
  main()
}
