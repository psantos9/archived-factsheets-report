import { expose, wrap as wrapWorker } from 'comlink'
import InlineWorker from '@/worker?worker&inline'
import { openDB, deleteDB, wrap, unwrap } from 'idb'

export const getInstance = (): typeof MyClass => wrapWorker<typeof MyClass>(new InlineWorker())
let myvalue = 42

export const MyClass = {
  async logSomething() {
    const db = await openDB('my db', 2, {
      upgrade(db) {
        db.createObjectStore('keyval')
      }
    })
    const key = await db.put('keyval', new Date(), 'PAULO2')
    console.log('KEY', key)
    myvalue++
    console.log(`my value = ${myvalue}`, indexedDB)
  }
}

expose(MyClass)
