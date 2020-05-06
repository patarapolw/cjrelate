import { getModelForClass, prop } from '@typegoose/typegoose'

class Sentence {
  @prop({ unique: true, sparse: true }) tatoebaId?: number
  @prop({ required: true, index: true }) lang!: string
  @prop({ required: true }) text!: string
  @prop({ default: () => [], index: true }) translationIds!: number[]
  @prop({ default: () => [], index: true }) tags!: string[]
}

export const SentenceModel = getModelForClass(Sentence, { schemaOptions: { collection: 'sentence' } })
