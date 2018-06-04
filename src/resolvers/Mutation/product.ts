import shortid from 'shortid'
import { forwardTo } from 'prisma-binding'
import { createWriteStream } from 'fs'
import { getUserId, Context } from '../../utils'

const processUpload = async upload => {
  const { stream, filename, mimetype, encoding } = await upload
  const { path } = await storeUpload({ stream, filename })
  return path
}

const storeUpload = async ({ stream, filename }): Promise<any> => {
  const id = shortid.generate()
  const path = `images/${id}-${filename}`

  return new Promise((resolve, reject) =>
    stream
      .pipe(createWriteStream(path))
      .on('finish', () => resolve({ path }))
      .on('error', reject),
  )
}

interface ProductData {
  name?: string;
  price?: number;
  pictureUrl?: string;
}

export const product = {
  async createProduct(parent, { name, price, picture }, ctx: Context, info) {
    const userId = getUserId(ctx)
    console.log('create product')
    
    return ctx.db.mutation.createProduct(
      {
        data: {
          name,
          price,
          pictureUrl: await processUpload(picture),
          seller: {
            connect: { id: userId },
          },
        },
      },
      info
    )
  },

  async updateProduct(parent, { id, name, price, picture }, ctx: Context, info) {
    const userId = getUserId(ctx)
    const product = await ctx.db.query.product({ where: { id } }, `{ seller { id } }`)
    console.log(product)
    if (userId !== product.seller.id) {
      throw new Error('Not authorized')
    }

    let pictureUrl = null
    if (picture) {
      pictureUrl = await processUpload(picture)
    }

    const data: ProductData = {};

    if (name) data.name = name
    if (price) data.price = price
    if (pictureUrl) data.pictureUrl = pictureUrl

    console.log('update product')
    return ctx.db.mutation.updateProduct(
      {
        data,
        where: {
          id
        }
      },
      info
    )
  },

  deleteProduct: forwardTo('db')
}