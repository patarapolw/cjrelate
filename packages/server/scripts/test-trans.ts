import sqlite3 from 'better-sqlite3'
import { mongoose } from '@typegoose/typegoose'
import { SentenceModel } from '../src/db/mongo'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })

  const db = sqlite3('assets/sentence.db')
  const items: any[] = []

  const push = (ss: any) => SentenceModel.insertMany(ss)

  for (const { id: tatoebaId, text, lang, translationIds: transJSON, tags: tagsJSON } of db.prepare(/*sql*/`
  SELECT id, [text], lang, translationIds, tags FROM sentence
  `).iterate()) {
    const tids = JSON.parse(transJSON)
    const tags = JSON.parse(tagsJSON)

    const r = db.prepare(/*sql*/`
    SELECT id, [text] FROM sentence
    WHERE id IN (${Array(tids.length).fill('?').join(',')}) AND lang != ?
    `).all([...tids, lang]) || {}

    if (r.length > 0) {
      console.log(text, r.map((r0) => r0.text))
      items.push({
        tatoebaId,
        text,
        lang,
        translationIds: r.map((r0) => r0.id),
        tags
      })

      if (items.length > 1000) {
        const ss = items.splice(0, 1000)
        await push(ss)
      }
    }
  }

  await push(items)

  db.close()

  mongoose.disconnect()
}

if (require.main === module) {
  main()
}
