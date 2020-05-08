import sqlite3 from 'better-sqlite3'

async function main () {
  const newDb = sqlite3('assets/tatoeba.db')
  newDb.exec(/*sql*/`
  CREATE TABLE sentence (
    id      INTEGER PRIMARY KEY,
    [text]  TEXT NOT NULL,
    lang    TEXT NOT NULL,
    tags    TEXT -- json
  );

  CREATE TABLE translation (
    sentence_id     INTEGER NOT NULL REFERENCES sentence(id),
    translation_id  INTEGER NOT NULL REFERENCES sentence(id),
    PRIMARY KEY (sentence_id, translation_id)
  );
  `)

  const db = sqlite3('assets/sentence.db')
  const items: any[] = []

  const pushSentence = (rs: any[]) => {
    const insert = newDb.prepare(/*sql*/`
    INSERT INTO sentence (id, [text], lang, tags)
    VALUES (@id, @text, @lang, @tags)
    `)
    const insertMany = newDb.transaction(() => {
      for (const { id, text, lang, tags } of rs) {
        insert.run({ id, text, lang, tags })
      }
    })
    insertMany()
  }

  for (const { id, text, lang, translationIds: transJSON, tags } of db.prepare(/*sql*/`
  SELECT id, [text], lang, translationIds, tags FROM sentence
  `).iterate()) {
    const tids = JSON.parse(transJSON)

    const r = db.prepare(/*sql*/`
    SELECT id, [text] FROM sentence
    WHERE id IN (${Array(tids.length).fill('?').join(',')}) AND lang != ?
    `).all([...tids, lang]) || {}

    if (r.length > 0) {
      items.push({
        id,
        text,
        lang,
        translationIds: r.map((r0) => r0.id),
        tags
      })

      if (items.length > 1000) {
        const ss = items.splice(0, 1000)
        pushSentence(ss)
      }
    }
  }

  pushSentence(items)

  const insert = newDb.prepare(/*sql*/`
  INSERT INTO translation (sentence_id, translation_id)
  VALUES (@id, @translation_id)
  `)
  newDb.transaction(() => {
    items.map((it) => {
      it.translationIds.map((translation_id: number) => {
        insert.run({ id: it.id, translation_id })
      })
    })
  })

  db.close()

  newDb.close()
}

if (require.main === module) {
  main()
}
