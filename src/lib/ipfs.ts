import { IIpfsConnector } from 'jolocom-lib/js/ipfs/types'
import { IDidDocumentAttrs } from 'jolocom-lib/js/identity/didDocument/types'

// @ts-ignore
const FormData = global.FormData || require('form-data')
// @ts-ignore
const fetch = global.fetch || require('node-fetch')

export class IpfsCustomConnector implements IIpfsConnector {
  private ipfsHost!: string

  constructor(config: { host: string; protocol: string; port: number }) {
    this.ipfsHost = `${config.protocol}://${config.host}:${config.port}`
  }

  async storeJSON({
    data,
    pin,
  }: {
    data: object
    pin: boolean
  }): Promise<string> {
    if (!data || typeof data !== 'object') {
      throw new Error(`JSON expected, received ${typeof data}`)
    }

    const endpoint = `${this.ipfsHost}/api/v0/add?pin=${pin}`

    // NOTE: we use FormData because it automatically creates the necessary
    // headers, which are not trivially
    // see https://github.com/github/fetch/issues/505#issuecomment-293064470
    const body = new FormData()
    body.append('ddo', Buffer.from(JSON.stringify(data)))

    const res = await fetch(endpoint, { method: 'POST', body })
    const resJson = await res.json()
    return resJson.Hash
  }

  async catJSON(hash: string): Promise<IDidDocumentAttrs> {
    const endpoint = `${this.ipfsHost}/api/v0/cat?arg=${hash}`
    const res = await fetch(endpoint, { method: 'GET' })
    return res.json()
  }

  async removePinnedHash(hash: string): Promise<void> {
    const resolutionGateway = 'https://ipfs.io/ipfs/'
    const endpoint = `${resolutionGateway}/${hash}`
    const res = await fetch(endpoint, { method: 'GET' })

    // @ts-ignore
    if (res.respInfo.status !== 200) {
      throw new Error(
        // @ts-ignore
        `Removing pinned hash ${hash} failed, status code: ${res.respInfo.status}`,
      )
    }
  }

  async createDagObject({
    data,
    pin,
  }: {
    data: object
    pin: boolean
  }): Promise<string> {
    if (!data || typeof data !== 'object') {
      throw new Error(`Object expected, received ${typeof data}`)
    }

    const endpoint = `${this.ipfsHost}/api/v0/dag/put?pin=${pin}`
    const body = new FormData()
    body.append('dag', Buffer.from(JSON.stringify(data)))

    const res = fetch(endpoint, { method: 'POST', body })
    const resJson = await res.json()
    return resJson.Cid['/']
  }

  async resolveIpldPath(pathToResolve: string): Promise<object> {
    const endpoint = `${this.ipfsHost}/api/v0/dag/get?arg=${pathToResolve}`
    const res = fetch(endpoint, { method: 'GET' })

    return await res.json()
  }
}
