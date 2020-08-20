import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found');
    }

    const ids = products.map(product => {
      return { id: product.id };
    });

    const productsArray = await this.productsRepository.findAllById(ids);
    const finalProducts = productsArray.map(productData => {
      const finalProduct = products.find(index => index.id === productData.id);
      return {
        product_id: productData.id,
        price: productData.price,
        quantity: finalProduct?.quantity || 0,
      };
    });
    const order = await this.ordersRepository.create({
      customer,
      products: finalProducts,
    });
    await this.productsRepository.updateQuantity(products);
    return order;
  }
}

export default CreateOrderService;
