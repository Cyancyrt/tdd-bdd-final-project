const express = require('express');
const { Product, Category } = require('../models/product');
const { Op } = require('sequelize');
const { validateProduct, checkContentType } = require('../middleware/validation');

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({ status: 200, message: 'OK' });
});

router.post('/', checkContentType('application/json'), validateProduct, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    const location = `/api/products/${product.id}`;
    return res.status(201).location(location).json(product.serialize());
  } catch (error) {
    return res.status(400).json({
      error: 'Bad Request',
      message: error.message
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Not Found' });
    }
    return res.status(200).json(product.serialize());
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.put('/:id', checkContentType('application/json'), validateProduct, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Not Found' });
    }
    await product.update(req.body);
    return res.status(200).json(product.serialize());
  } catch (error) {
    return res.status(400).json({
      error: 'Bad Request',
      message: error.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Not Found' });
    }
    await product.destroy();
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { name, category, availability } = req.query;
    const where = {};

    if (name) {
      where.name = { [Op.iLike]: `%${name}%` };
    }

    if (typeof availability !== 'undefined') {
      where.available = availability === 'true';
    }

    if (category) {
      if (!Object.values(Category).includes(category)) {
        return res.status(200).json([]);
      }
      where.category = category;
    }

    const products = await Product.findAll({ where });
    return res.status(200).json(products.map((p) => p.serialize()));
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;