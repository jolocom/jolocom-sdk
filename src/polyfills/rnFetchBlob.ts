import fetch from 'node-fetch'
import FormData from 'form-data'

// default export merge of all default exports
export default {
  // RNFetchBlob default export
  // @ts-ignore
  fetch: function(method, endpoint, headers?, formDataList?) {
    const body = new FormData()
    formDataList.forEach((item: { name: string; data: string }) => {
      body.append(item.name, item.data)
    })
    return fetch(endpoint, { method, body, headers })
  },
}
