import axiosInstance from './axiosInstance'

export async function getTableConfigs(industry_id: string) {
  const resp = await axiosInstance.get(`/table-configs/${industry_id}`)
  return resp.data
}

export async function postTableConfigs(payload: any) {
  const resp = await axiosInstance.post('/table-configs', payload)
  return resp.data
}

export async function getFormConfig(form_name: string) {
  const resp = await axiosInstance.get(`/form-configs/${form_name}`)
  return resp.data
}

export async function postFormConfig(payload: any) {
  const resp = await axiosInstance.post('/form-configs', payload)
  return resp.data
}

export default { getTableConfigs, postTableConfigs, getFormConfig, postFormConfig }
