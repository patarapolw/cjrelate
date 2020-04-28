import fs from 'fs'

import csvParser from 'csv-parser'
import mongoose from 'mongoose'

import 'log-buffer'

import { DbTranslationModel, DbSentenceTagModel } from '../src/db/mongo'

async function uploadSentence (): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const langs = new Set<string>(['cmn', 'jpn', 'eng'])
    // const sentences: any[] = []
    const ids: number[] = []

    fs.createReadStream('/Users/patarapolw/Downloads/sentences.csv', 'utf8')
      .pipe(csvParser({
        separator: '\t',
        headers: ['_id', 'lang', 'text']
      }))
      .on('data', (data) => {
        if (langs.has(data.lang)) {
          // sentences.push(data)
          ids.push(data._id)
        }

        // if (sentences.length > 1000) {
        //   const ss = sentences.splice(0, 1000)
        //   DbSentenceModel.insertMany(ss)
        // }
      })
      .on('end', async () => {
        // await DbSentenceModel.insertMany(sentences)
        resolve(ids)
      })
      .on('error', reject)
  })
}

async function uploadTranslation (ids: number[]) {
  const idSet = new Set(ids)

  return new Promise((resolve, reject) => {
    const sentences: any[] = []

    fs.createReadStream('/Users/patarapolw/Downloads/links.csv', 'utf8')
      .pipe(csvParser({
        separator: '\t',
        headers: ['sentenceId', 'translationId']
      }))
      .on('data', (data) => {
        if (idSet.has(data.sentenceId) && idSet.has(data.translationId)) {
          sentences.push(data)
        }

        if (sentences.length > 1000) {
          const ss = sentences.splice(0, 1000)
          DbTranslationModel.insertMany(ss)
        }
      })
      .on('end', async () => {
        await DbTranslationModel.insertMany(sentences)
        resolve()
      })
      .on('error', reject)
  })
}

async function uploadTag (ids: number[]) {
  const idSet = new Set(ids)

  return new Promise((resolve, reject) => {
    const sentences: any[] = []

    fs.createReadStream('/Users/patarapolw/Downloads/tags.csv', 'utf8')
      .pipe(csvParser({
        separator: '\t',
        headers: ['sentenceId', 'tagName']
      }))
      .on('data', (data) => {
        if (idSet.has(data.sentenceId)) {
          sentences.push(data)
        }

        if (sentences.length > 1000) {
          const ss = sentences.splice(0, 1000)
          DbSentenceTagModel.insertMany(ss)
        }
      })
      .on('end', async () => {
        await DbSentenceTagModel.insertMany(sentences)
        resolve()
      })
      .on('error', reject)
  })
}

async function main () {
  const client = await mongoose.connect(process.env.MONGO_URI!, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })

  const ids = await uploadSentence()
  await uploadTranslation(ids)
  await uploadTag(ids)

  client.disconnect()
}

if (require.main === module) {
  main()
}
