// @ts-ignore TODO
const fetch = global.fetch || require('node-fetch')

interface HttpAgent {
  getRequest<T>(endpoint: string): Promise<T>
  postRequest<T>(endpoint: string, headers: any, data: any): Promise<T>
  headRequest(endpoint: string): Promise<{ status: number }>
}

enum HttpMethods {
  GET = 'GET',
  POST = 'POST',
  HEAD = 'HEAD',
}

/**
 * @todo is this used anywhere?
 * @todo the res.json() prevents us from using these methods
 * Also
 */
export const httpAgent: HttpAgent = {
  getRequest: <T>(endpoint: string): Promise<T> =>
    fetch(endpoint, {
      method: HttpMethods.GET,
    }).then((res: { json: () => any }) => res.json()),
  headRequest(endpoint: string) {
    return fetch(endpoint, {
      method: HttpMethods.HEAD,
    }).then((res: { json: () => any }) => res.json())
  },
  postRequest<T>(endpoint: string, headers: any = {}, data: any): Promise<T> {
    const body = typeof data === 'string' ? data : JSON.stringify(data)
    return fetch(endpoint, {
      method: HttpMethods.POST,
      headers,
      body
    }).then(async (res: { ok: boolean, status: number, json: () => any, text: () => string }) => {
      if (!res.ok || res.status !== 200) {
        const err = new Error('http request failed')
        console.error('http request failed', err, res, '\nResponse Body', await res.text())
        throw err
      }
      return res.json()
    })
  },
}
