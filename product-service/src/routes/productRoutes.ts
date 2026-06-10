import express from 'express';
import { 
  getAllProducts, 
  getProduct, 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController';
import { protect } from '../shared/middleware/auth';
import { validate } from '../shared/middleware/validate';
import { 
  createProductSchema, 
  updateProductSchema, 
  productQuerySchema 
} from '../validations/product.validation';

const router = express.Router();

router.get('/', validate(productQuerySchema, 'query'), getAllProducts);
router.get('/:id', getProduct);
router.post('/', protect, validate(createProductSchema), createProduct);
router.put('/:id', protect, validate(updateProductSchema), updateProduct);
router.delete('/:id', protect, deleteProduct);

export const productRouter = router;