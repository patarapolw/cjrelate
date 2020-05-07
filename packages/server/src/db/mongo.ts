import { getModelForClass, prop } from '@typegoose/typegoose'

class Sentence {
  @prop({ unique: true, sparse: true }) tatoebaId?: number
  @prop({ required: true, index: true }) lang!: string
  @prop({ required: true }) text!: string
  @prop({ default: () => [], index: true }) translationIds!: number[]
  @prop({ default: () => [], index: true }) tags!: string[]
}

export const SentenceModel = getModelForClass(Sentence, { schemaOptions: { collection: 'sentence' } })

class Character {
  @prop({ unique: true }) entry!: string
  @prop({ default: () => [], index: true }) sub!: string[]
  @prop({ default: () => [], index: true }) sup!: string[]
  @prop({ default: () => [], index: true }) var!: string[]
}

export const CharacterModel = getModelForClass(Character, { schemaOptions: { collection: 'character' } })
