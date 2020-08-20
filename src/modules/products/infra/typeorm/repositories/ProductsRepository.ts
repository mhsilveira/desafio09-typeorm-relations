import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });
    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findByName = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    return findByName;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const productsIds = products.map(product => product.id);
    const orderList = await this.ormRepository.find({ id: In(productsIds) });
    if (productsIds.length !== orderList.length) {
      throw new AppError('There are products missing');
    }
    return orderList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const getAllProducts = await this.findAllById(products);
    const newProducts = getAllProducts.map(productData => {
      const foundProduct = products.find(
        product => product.id === productData.id,
      );
      if (!foundProduct) {
        throw new AppError('Product not found');
      }
      if (productData.quantity < foundProduct.quantity) {
        throw new AppError('Not enough products.');
      }
      const productNoReassign = productData;
      productNoReassign.quantity -= foundProduct.quantity;
      return productNoReassign;
    });
    await this.ormRepository.save(newProducts);
    return newProducts;
  }
}

export default ProductsRepository;
