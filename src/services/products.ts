import { Product } from "../types"
import { api } from "./api"

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    const response = await api.get('/products')
    return response?.data ?? []
  } catch {
    return []
  }
}

export const getProductById = async (productId: number): Promise<Product | null> => {
  try {
    const response = await api.get(`products/${productId}`)
    return response?.data ?? null
  } catch {
    return null
  }
}
