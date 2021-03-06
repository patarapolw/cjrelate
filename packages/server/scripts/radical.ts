import sqlite3 from 'better-sqlite3'

async function main () {
  const newDb = sqlite3('assets/radical.db')
  newDb.exec(/*sql*/`
  CREATE TABLE radical (
    [entry] TEXT NOT NULL UNIQUE,
    sub     TEXT,
    sup     TEXT,
    [var]   TEXT
  )
  `)

  const insert = newDb.prepare(/*sql*/`
  INSERT INTO radical ([entry], sub, sup, [var])
  VALUES (@entry, @sub, @sup, @var)
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
  SELECT [entry], sub, sup, [var] FROM token
  `).iterate()) {
    if (!r.sub && !r.sup && !r.var) {
      continue
    }

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
