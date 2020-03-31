import { initStore, entities, actions } from '../src'

const welcomeBanner = `
/****** This code was executed ******/
let store = require('src/store').initStore()
let bmw = store.backendMiddleware
let s = bmw.storageLib
let e = require('src/lib/storage/entities')
let a = require('src/actions')

/****** Cheatsheet ******
 *
 * p = _ // put last return value in global variable p
 * store.dispatch(a.registrationActions.createIdentity(crypto.randomBytes(16)))
 * store.dispatch(a.accountActions.checkIdentityExists)
 * store.getState()
 ***********************/

 Please press [RETURN] for a prompt
`

if (process.env.REPL) {
  // if we are running as a REPL

  const store = initStore()
  const storage = store.backendMiddleware.storageLib

  const replGlobalMerge = (function(gl) {
    return (toMerge: object) => Object.assign(gl, toMerge)
  })(global)

  // assign some useful shortcuts
  replGlobalMerge({
    storage,
    entities,
    bmw: store.backendMiddleware,
    store,
    actions,
    s: storage,
    e: entities,
    a: actions,
  })

  // @ts-ignore
  const connPromise = global.storage.initConnection()
  connPromise.then(() => {
    // this doesn't work, presumably because it's async
    // but the funny thing is console.log(conn) at the end works
    // Yet on the repl there's no conn global.
    //
    // @mnzaki tried capturing the global object in a closure (as function
    // arguments and as a const alias) and it still didn't work
    //
    replGlobalMerge({
      // @ts-ignore
      conn: global.storage.connection,
    })

    // @ts-ignore
    // console.log(conn)

    console.log(welcomeBanner)
  })
}
