import shortid from 'shortid'
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
  }
}