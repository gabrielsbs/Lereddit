import DataLoader from 'dataloader'
import { Updoot } from '../entity/Updoot'

export const createUpdootLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Updoot | null>(async keys => {
    const updoots = await Updoot.findByIds(keys as any)
    const updootIdToUser: Record<string, Updoot> = {}
    updoots.forEach(updoot => {
      updootIdToUser[`${updoot.userId}_${updoot.postId}`] = updoot
    })
    return keys.map(updootKey => updootIdToUser[`${updootKey.userId}_${updootKey.postId}`])
  })
