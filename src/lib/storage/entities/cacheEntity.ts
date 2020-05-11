import { Expose } from 'class-transformer'

@Expose()
export class CacheEntity {
  key!: string
  value!: any
}
