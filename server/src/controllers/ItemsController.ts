import {Request, Response} from 'express'
import knex from '../database/connection'

class ItemsController{
  async index(req: Request, res: Response) {
    const items = await knex('items').select('*')
    const serializedItems = items.map(i => {
      return {
        id: i.id,
        title: i.title,
        image_url: `http://192.168.15.30:3333/uploads/${i.image}`,
      }
    })
    return res.json(serializedItems)
  }
}

export default ItemsController