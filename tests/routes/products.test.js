const request = require('supertest');
const app = require('../../src/app');
const { Product } = require('../../src/models/product');
const { ProductFactory } = require('../factories');
const BASE_URL = '/api/products';

describe('Product Routes', () => {

  
  /**
   * Utility function to bulk create products
   */
  async function createProducts(count = 1) {
    const products = [];
    for (let i = 0; i < count; i++) {
      const productData = ProductFactory.build();
      const product = await Product.create(productData);
      products.push(product);
    }
    return products;
  }
  
  /**
   * Utility function to get product count
   */
  async function getProductCount() {
    const response = await request(app)
      .get(BASE_URL)
      .expect(200);
    return response.body.length;
  }
  
  describe('Basic Endpoints', () => {
    test('should return the index page', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.text).toContain('Product Catalog Administration');
    });
    
    test('should be healthy', async () => {
      const response = await request(app)
        .get(`${BASE_URL}/health`)
        .expect(200);
      
      expect(response.body.message).toBe('OK');
    });
  });

  
  
  describe('CREATE Product', () => {
    test('should create a new product', async () => {
      const testProduct = ProductFactory.build();

      
      const response = await request(app)
        .post(BASE_URL)
        .send(testProduct)
        .expect(201);
      
      // Make sure location header is set
      expect(response.headers.location).toBeDefined();
      
      // Check the data is correct
      const newProduct = response.body;
      expect(newProduct.name).toBe(testProduct.name);
      expect(newProduct.description).toBe(testProduct.description);
      expect(newProduct.price).toBe(testProduct.price);
      expect(newProduct.available).toBe(testProduct.available);
      expect(newProduct.category).toBe(testProduct.category);
      
      
      
      
    });
    
    test('should not create a product without a name', async () => {
      const productData = ProductFactory.build();
      delete productData.name;
      

      
      const response = await request(app)
        .post(BASE_URL)
        .send(productData)
        .expect(400);
      
      expect(response.body.error).toBe('Validation Error');
    });
    
    test('should not create a product with no Content-Type', async () => {
      await request(app)
        .post(BASE_URL)
        .send('bad data')
        .expect(415);
    });
    
    test('should not create a product with wrong Content-Type', async () => {
      await request(app)
        .post(BASE_URL)
        .set('Content-Type', 'text/plain')
        .send('some plain text data')
        .expect(415);
    });

    test('should proceed if content type is correct but has extra parameters', async () => {
      const productData = ProductFactory.build();
      const response = await request(app)
        .post(BASE_URL)
        .set('Content-Type', 'application/json; charset=utf-8')
        .send(productData);

      // We expect a 201, not a 415, because the base type is correct.
      expect(response.status).toBe(201);
    });
  });


  // ADD TEST HERE
  describe('READ Product', () => {
    test('should get a single product', async () => {
    const products = await createProducts(1);
    const testProduct = products[0];
    
    const response = await request(app)
        .get(`${BASE_URL}/${testProduct.id}`)
        .expect(200);
    
    expect(response.body.name).toBe(testProduct.name);
    });
    test('should not get a product that is not found', async () => {
      await request(app)
        .get(`${BASE_URL}/99999`)
        .expect(404);
    });

	});
    describe('UPDATE Product', () => {
        test('should update a product', async () => {
        const products = await createProducts(1);
        const productToUpdate = products[0];
        const updatePayload = {
            name: 'Updated Name',
            description: 'Updated Description',
            price: '123.45',
            category: productToUpdate.category,
            available: !productToUpdate.available
        };

        const response = await request(app)
            .put(`${BASE_URL}/${productToUpdate.id}`)
            .send(updatePayload)
            .expect(200);

        expect(response.body.id).toBe(productToUpdate.id);
        expect(response.body.name).toBe(updatePayload.name);
        expect(response.body.price).toBe(parseFloat(updatePayload.price));
        expect(response.body.available).toBe(updatePayload.available);

    });
    test('should return 404 when updating a non-existent product', async () => {
    const updatedData = ProductFactory.build();
    await request(app)
        .put(`${BASE_URL}/99999`)
        .send(updatedData)
        .expect(404);
    });
    test('should return 400 on validation error during update', async () => {
    const products = await createProducts(1);
    const product = products[0];
    const invalidUpdateData = { name: '' }; // Invalid name

    await request(app)
        .put(`${BASE_URL}/${product.id}`)
        .send(invalidUpdateData)
        .expect(400);
    });

    });
    describe('DELETE Product', () => {
        test('should delete a product', async () => {
          const products = await createProducts(1);
          const product = products[0];
    
          await request(app)
            .delete(`${BASE_URL}/${product.id}`)
            .expect(204);
    
          // Verify it's gone
          await request(app)
            .get(`${BASE_URL}/${product.id}`)
            .expect(404);
        });
        test('should return 404 when deleting a non-existent product', async () => {
            await request(app)
              .delete(`${BASE_URL}/99999`)
              .expect(404);
        });
        
      
    });
    describe('LIST Products', () => {
        test('should list all products', async () => {
          await createProducts(5);
          const response = await request(app)
            .get(BASE_URL)
            .expect(200);
          expect(response.body.length).toBe(5);
        });
    });
    describe('FILTER Products', () => {
        test('should filter products by name', async () => {
            await createProducts(2);
            const productData = ProductFactory.build({ name: 'My Special Laptop' });
            await request(app).post(BASE_URL).send(productData).expect(201);
            await createProducts(2);
    
            const response = await request(app)
            .get(`${BASE_URL}?name=Special%20Laptop`)
            .expect(200);
            expect(response.body.length).toBe(1);
            expect(response.body[0].name).toBe('My Special Laptop');
        });  
        test('should filter products by category', async () => {
            const defaultCategoryProduct = ProductFactory.build({ category: 'FOOD' });
            const specialCategoryProduct = ProductFactory.build({ category: 'TOOLS' });
            await request(app).post(BASE_URL).send(defaultCategoryProduct).expect(201);
            await request(app).post(BASE_URL).send(specialCategoryProduct).expect(201);
            
            const response = await request(app)
            .get(`${BASE_URL}?category=TOOLS`)
            .expect(200);
    
            expect(response.body.length).toBe(1);
            expect(response.body[0].category).toBe('TOOLS');
        });  
        test('should filter products by availability', async () => {
            const availableProduct = ProductFactory.build({ available: true });
            const unavailableProduct = ProductFactory.build({ available: false });
        
            await request(app).post(BASE_URL).send(availableProduct).expect(201);
            await request(app).post(BASE_URL).send(unavailableProduct).expect(201);
        
            const response = await request(app)
            .get(`${BASE_URL}?availability=true`)
            .expect(200);
        
            expect(response.body.length).toBe(1);
            expect(response.body[0].available).toBe(true);
        });
    });
      
});