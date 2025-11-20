import axios from 'axios';
import config from '../../../shared/config';
import logger from '../../../shared/logger';

export interface ProductData {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
}

export const getProductById = async (productId: string): Promise<ProductData | null> => {
  try {
    const response = await axios.get(`${config.services.product}/api/products/${productId}`);
    
    if (response.data.status === 'success' && response.data.data?.product) {
      return response.data.data.product;
    }
    
    return null;
  } catch (error) {
    logger.error(`Failed to fetch product ${productId} from product-service:`, error);
    return null;
  }
};

export const getProductsByIds = async (productIds: string[]): Promise<Map<string, ProductData>> => {
  const productsMap = new Map<string, ProductData>();
  
  try {
    // Make parallel requests for all products
    const productPromises = productIds.map(id => getProductById(id));
    const products = await Promise.all(productPromises);
    
    products.forEach((product, index) => {
      if (product && productIds[index]) {
        productsMap.set(productIds[index], product);
      }
    });
    
    return productsMap;
  } catch (error) {
    logger.error('Failed to fetch products from product-service:', error);
    return productsMap;
  }
};
