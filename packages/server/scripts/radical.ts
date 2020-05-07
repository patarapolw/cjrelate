import sqlite3 from 'better-sqlite3'
import { CharacterModel } from '../src/db/mongo'
import { mongoose } from '@typegoose/typegoose'
import 'log-buffer'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
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

    ss.push({
      entry: r.entry,
      sub: r.sub.split(''),
      sup: r.sup.split(''),
      var: r.var.split('')
    })

    if (ss.length > 1000) {
      const s = ss.splice(0, 1000)
      await CharacterModel.insertMany(s)
      console.log('inserting', i++)
    }
  }

  if (ss.length > 0) {
    await CharacterModel.insertMany(ss)
  }
  console.log('done')

  db.close()

  mongoose.disconnect()
}

if (require.main === module) {
  main()
}
