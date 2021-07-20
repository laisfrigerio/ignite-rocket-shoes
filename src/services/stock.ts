import { Stock } from "../types"
import { api } from "./api"

export const getProductFromStock = async (productId: number) : Promise<Stock | null> => {
  try {
    const response = await api.get(`stock/${productId}`)
    return response?.data ?? null
  } catch {
    return null
  }
}
