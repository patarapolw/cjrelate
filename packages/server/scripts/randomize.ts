import { mongoose } from '@typegoose/typegoose'
import { SentenceModel } from '../src/db/mongo'

async function main () {
  await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })

  const r = await SentenceModel.aggregate([
    { $match: { lang: 'cmn' } },
    { $sample: { size: 10 } },
    {
      $lookup: {
        from: 'sentence',
        localField: 'translationIds',
        foreignField: 'tatoebaId',
        as: 't'
      }
    },
    {
      $project: {
        text: 1,
        translation: '$t.text'
      }
    }
  ])

  console.log(r)

  console.log(await SentenceModel.countDocuments({ lang: 'cmn' }))
  console.log(await SentenceModel.countDocuments({ lang: 'jpn' }))

  mongoose.disconnect()
}

if (require.main === module) {
  main()
}
