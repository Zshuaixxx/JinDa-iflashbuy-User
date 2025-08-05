// 导入useMainStore函数
import { useMainStore } from './../store'
import { baseUrl } from './env'
// 参数： url:请求地址  param：请求参数  method：请求方式
// 使用Pinia的方式获取store
// 注意：在函数内部获取store实例

export function request({url='', params={}, method='GET'}) {
  // 在函数内部创建store实例
  const store = useMainStore()

  let header = {
    'Accept': 'application/json',
    'Access-Control-Allow-Origin':'*',
    'Content-Type': 'application/json', 
    'authentication': store.token
  }

  const requestRes = new Promise((resolve, reject) => {
    // 使用store的方法设置状态
    store.setLodding(false)

    uni.request({
      url: baseUrl+url, 
      data: params,
      header: header,
      method: method,
      success: (res) => {
        const { data } = res
        if (data.code == 200 || data.code === 1) {
          resolve(res.data)
        } else {
          reject(res.data)
        }
      },
      fail: (err) => {
        const error = {data:{msg:err.data}}
        reject(error)
      }
    });
  })
  return requestRes
}

