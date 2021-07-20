import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { Product, Stock } from '../types';
import { STORAGE_CART } from '../const';
import { getProductById } from '../services/products';
import { getProductFromStock } from '../services/stock';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem(STORAGE_CART);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });
  
  const setCartIntoStorage = (newCart: Product[]) => {
    localStorage.setItem(STORAGE_CART, JSON.stringify(newCart))
  }

  const updateCart = (newCart: Product[]) => {
    setCart(newCart)
    setCartIntoStorage(newCart)
  }

  const getProductFromServer = async (productId: number): Promise<Product | null> => {
    return await getProductById(productId)
  }

  const addProduct = async (productId: number) => {
    try {
      const product = cart.find(item => item.id === productId)

      const productFromServer: Product | null = await getProductFromServer(productId)
      const stockFromServer: Stock | null = await getProductFromStock(productId)

      if (!productFromServer || !stockFromServer) {
        throw new Error('Erro na adição do produto')
      }

      const totalNewAmount = (product?.amount ?? 0) + 1

      if (totalNewAmount > stockFromServer.amount) {
        throw new Error('Quantidade solicitada fora de estoque')
      }

      if (product) { // incrementa a quantidade quando o produto já está no carrinho
        const newCart = cart.map(item => {
          if (item.id === productId) {
            item.amount = totalNewAmount
          }

          return item
        })

        updateCart(newCart)
        return
      }

      const newCart = [ ...cart, { ...productFromServer, amount: 1 }]
      updateCart(newCart)
    } catch (error) {
      toast.error(error.message)
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(item => item.id !== productId)

      if (newCart.length === cart.length) {
        throw new Error('Erro na remoção do produto')
      }

      updateCart(newCart)
    } catch (error) {
      toast.error(error.message)
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) {
      return
    }

    const productFromStock = await getProductFromStock(productId)

    try {
      if (!productFromStock) {
        throw new Error('Erro na alteração de quantidade do produto')
      }

      if (productFromStock.amount < amount) {
        throw new Error('Quantidade solicitada fora de estoque')
      }

      const newCart = cart.map(item => {
        if (item.id === productId) {
          item.amount = amount
        }

        return item
      })

      updateCart(newCart)
    } catch (error) {
      toast.error(error.message)
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
