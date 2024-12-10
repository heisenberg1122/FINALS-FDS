const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const port = 3001;

const app = express();
app.use(bodyParser.json());

// Create a connection to the MySQL database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',           // Replace with your MySQL username
  password: 'adminroot',  // Replace with your MySQL password
  database: 'final_system' 
});

// Connect to the database
db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
  console.log('Connected to MySQL database.');
});

// --- PRODUCTS CRUD ---
// Get all products
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// Get a specific product by ID
app.get('/api/getproducts/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(results[0]);
  });
});

// Create a new product
app.post('/api/addproducts', (req, res) => {
  const { name, description, price, stock } = req.body;

  if (!name || !description || !price || !stock) {
    return res.status(400).json({ message: 'Missing required fields (name, description, price, stock)' });
  }

  db.query(
    'INSERT INTO products (name, description, price, stock) VALUES (?, ?, ?, ?)',
    [name, description, price, stock],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      res.status(201).json({
        id: result.insertId,
        name,
        description,
        price,
        stock,
      });
    }
  );
});

// Update a product
app.put('/api/updateproducts/:id', (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;

  db.query(
    'UPDATE products SET name = ?, description = ?, price = ?, stock = ? WHERE id = ?', 
    [name, description, price, stock, id], 
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

// Delete a product
app.delete('/api/deleteproducts/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// --- CUSTOMERS CRUD ---
// Get all customers
app.get('/api/customers', (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// Get a specific customer by ID
app.get('/api/getcustomers/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM customers WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json(results[0]);
  });
});

// Create a new customer
app.post('/api/addcustomers', (req, res) => {
  const { name, email, phone } = req.body;
  db.query('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [name, email, phone], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.status(201).json({ id: result.insertId, name, email, phone });
  });
});

// Update a customer
app.put('/api/updatecustomers/:id', (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  db.query(
    'UPDATE customers SET name = ?, email = ?, phone = ? WHERE id = ?', 
    [name, email, phone, id], 
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

// Delete a customer
app.delete('/api/deletecustomers/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM customers WHERE id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

// Create a new order
app.post('/api/addorders', (req, res) => {
  const { customerId, productId, quantity } = req.body;

  // Check if the product exists and if enough stock is available
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, productResults) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (productResults.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const product = productResults[0];
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Fixed price of 250 per unit
    const price = 250; 
    const totalAmount = price * quantity;

    // Create the order
    db.query('INSERT INTO orders (customer_id, product_id, quantity, total_amount) VALUES (?, ?, ?, ?)', 
      [customerId, productId, quantity, totalAmount], (err, orderResult) => {
        if (err) {
          return res.status(500).json({ message: 'Database error', error: err });
        }

        // Update product stock
        db.query('UPDATE products SET stock = stock - ? WHERE id = ?', [quantity, productId], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to update stock', error: err });
          }
          res.status(201).json({
            orderId: orderResult.insertId,
            customerId,
            productId,
            quantity,
            totalAmount
          });
        });
      });
  });
});
// --- Get all orders ---
app.get('/api/ssorders', (req, res) => {
  db.query('SELECT * FROM orders', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// --- Get specific order by ID ---
app.get('/api/sorders/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM orders WHERE id = ?', [id], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(results[0]);
  });
});

// --- INVENTORY CRUD ---

// Add a new inventory record
app.post('/api/inventory', (req, res) => {
  const { productId, quantity } = req.body;

  // Validate that product exists
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Insert into the inventory table
    db.query('INSERT INTO inventory (product_id, quantity) VALUES (?, ?)', [productId, quantity], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }

      // Update the product stock as well
      db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [quantity, productId], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to update stock', error: err });
        }
        res.status(201).json({
          productId,
          quantity,
          message: 'Inventory updated'
        });
      });
    });
  });
});

// Get all inventory records
app.get('/api/allinventory', (req, res) => {
  db.query('SELECT * FROM inventory', (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    res.json(results);
  });
});

// Get inventory record by product_id
app.get('/api/speinventory/:productId', (req, res) => {
  const { productId } = req.params;
  db.query('SELECT * FROM inventory WHERE product_id = ?', [productId], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Inventory not found for this product' });
    }
    res.json(results[0]);
  });
});

// Update an inventory record
app.put('/api/updateinventory/:productId', (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  // Validate that the product exists
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, productResults) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (productResults.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if an inventory record already exists for this product
    db.query('SELECT * FROM inventory WHERE product_id = ?', [productId], (err, inventoryResults) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }

      if (inventoryResults.length === 0) {
        return res.status(404).json({ message: 'Inventory record not found for this product' });
      }

      // Update the inventory record's quantity
      db.query('UPDATE inventory SET quantity = ? WHERE product_id = ?', [quantity, productId], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to update inventory', error: err });
        }

        // Update the product stock in the products table as well
        db.query('UPDATE products SET stock = ? WHERE id = ?', [quantity, productId], (err) => {
          if (err) {
            return res.status(500).json({ message: 'Failed to update product stock', error: err });
          }

          res.json({ message: 'Inventory updated successfully', productId, quantity });
        });
      });
    });
  });
});

// Delete an inventory record
app.delete('/api/deleteinventory/:productId', (req, res) => {
  const { productId } = req.params;

  // Validate that the product exists
  db.query('SELECT * FROM products WHERE id = ?', [productId], (err, productResults) => {
    if (err) {
      return res.status(500).json({ message: 'Database error', error: err });
    }
    if (productResults.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if an inventory record exists for the product
    db.query('SELECT * FROM inventory WHERE product_id = ?', [productId], (err, inventoryResults) => {
      if (err) {
        return res.status(500).json({ message: 'Database error', error: err });
      }
      if (inventoryResults.length === 0) {
        return res.status(404).json({ message: 'Inventory record not found for this product' });
      }

      // Delete the inventory record
      db.query('DELETE FROM inventory WHERE product_id = ?', [productId], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Failed to delete inventory', error: err });
        }

        // Optionally, you could update the stock in the products table, but it might not be necessary depending on your business logic.
        res.json({ message: 'Inventory record deleted successfully', productId });
      });
    });
  });
});


// --- SERVER SETUP ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
