// Test script for JSON generation
console.log('Testing JSON generation...');

// Include the JSON generation function (simplified version for testing)
function generateComplexJsonObject(sizeHint = 10000) {
  const categories = ['electronics', 'clothing', 'books', 'home', 'sports', 'automotive'];
  const colors = ['red', 'blue', 'green', 'yellow', 'black', 'white', 'purple', 'orange'];
  const statuses = ['active', 'inactive', 'pending', 'completed', 'cancelled'];
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Henry'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];

  // Calculate approximate items needed to reach size hint
  const baseObjectSize = 200; // Rough estimate of base object size in JSON
  const targetItems = Math.max(1, Math.floor(sizeHint / baseObjectSize));

  const data = {
    metadata: {
      version: '2.1.0',
      generated: new Date().toISOString(),
      totalItems: targetItems,
      schema: 'benchmark_data_v2'
    },

    users: [],
    products: [],
    orders: [],
    analytics: {
      daily: [],
      monthly: []
    },

    configuration: {
      features: {
        darkMode: true,
        notifications: true,
        analytics: false,
        experimental: {
          beta: true,
          alpha: false,
          gamma: null
        }
      },
      limits: {
        maxUsers: 10000,
        maxProducts: 50000,
        maxOrders: 100000,
        timeout: 30000
      }
    }
  };

  // Generate users
  const userCount = Math.max(1, Math.floor(targetItems * 0.3));
  for (let i = 0; i < userCount; i++) {
    data.users.push({
      id: `user_${i + 1}`,
      firstName: firstNames[i % firstNames.length],
      lastName: lastNames[i % lastNames.length],
      email: `user${i + 1}@example.com`,
      age: 18 + (i % 50),
      status: statuses[i % statuses.length],
      preferences: {
        theme: colors[i % colors.length],
        notifications: i % 2 === 0,
        language: i % 3 === 0 ? 'en' : i % 3 === 1 ? 'es' : 'fr'
      },
      address: {
        street: `${123 + i} Main St`,
        city: `City${i % 10}`,
        state: `State${i % 5}`,
        zipCode: `${10000 + i}`,
        coordinates: {
          lat: 40.7128 + (i % 100) * 0.01,
          lng: -74.0060 + (i % 100) * 0.01
        }
      },
      tags: [
        `tag_${i % 10}`,
        `category_${categories[i % categories.length]}`,
        `level_${i % 5}`
      ]
    });
  }

  // Generate products
  const productCount = Math.max(1, Math.floor(targetItems * 0.4));
  for (let i = 0; i < productCount; i++) {
    data.products.push({
      id: `product_${i + 1}`,
      name: `Product ${i + 1}`,
      category: categories[i % categories.length],
      price: parseFloat((9.99 + (i % 1000) * 0.50).toFixed(2)),
      description: `This is a detailed description for product ${i + 1}. It includes many features and benefits.`,
      specifications: {
        weight: parseFloat((0.1 + (i % 100) * 0.05).toFixed(2)),
        dimensions: {
          height: 10 + (i % 20),
          width: 5 + (i % 15),
          depth: 2 + (i % 8)
        },
        color: colors[i % colors.length],
        material: i % 4 === 0 ? 'plastic' : i % 4 === 1 ? 'metal' : i % 4 === 2 ? 'wood' : 'fabric'
      },
      inventory: {
        inStock: i % 10 !== 0,
        quantity: i % 10 === 0 ? 0 : 1 + (i % 100),
        reserved: Math.floor((i % 20) / 2),
        reorderLevel: 5 + (i % 15)
      }
    });
  }

  // Generate orders
  const orderCount = Math.max(1, Math.floor(targetItems * 0.3));
  for (let i = 0; i < orderCount; i++) {
    const itemCount = 1 + (i % 3);
    const items = Array.from({ length: itemCount }, (_, j) => ({
      productId: `product_${((i + j) % productCount) + 1}`,
      quantity: 1 + (j % 3),
      price: parseFloat((9.99 + ((i + j) % 1000) * 0.50).toFixed(2))
    }));

    data.orders.push({
      id: `order_${i + 1}`,
      userId: `user_${(i % userCount) + 1}`,
      status: statuses[i % statuses.length],
      items: items,
      total: parseFloat(items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)),
      shipping: {
        method: i % 3 === 0 ? 'standard' : i % 3 === 1 ? 'express' : 'overnight',
        address: {
          street: `${456 + i} Shipping St`,
          city: `ShipCity${i % 8}`,
          state: `ShipState${i % 6}`,
          zipCode: `${20000 + i}`
        }
      },
      timestamps: {
        created: new Date(Date.now() - i * 3600000).toISOString(),
        updated: new Date(Date.now() - i * 1800000).toISOString()
      }
    });
  }

  return data;
}

// Test different sizes
const testSizes = [1000, 10000, 50000];

testSizes.forEach(size => {
  console.log(`\n--- Testing size: ${size} characters ---`);

  const start = performance.now();
  const jsonData = generateComplexJsonObject(size);
  const generateTime = performance.now() - start;

  const stringifyStart = performance.now();
  const jsonString = JSON.stringify(jsonData);
  const stringifyTime = performance.now() - stringifyStart;

  const parseStart = performance.now();
  const parsedData = JSON.parse(jsonString);
  const parseTime = performance.now() - parseStart;

  console.log(`Generated JSON with ${jsonString.length} characters in ${generateTime.toFixed(2)}ms`);
  console.log(`Users: ${jsonData.users.length}, Products: ${jsonData.products.length}, Orders: ${jsonData.orders.length}`);
  console.log(`JSON.stringify took: ${stringifyTime.toFixed(2)}ms`);
  console.log(`JSON.parse took: ${parseTime.toFixed(2)}ms`);
  console.log(`Total size: ${(jsonString.length / 1024).toFixed(2)} KB`);
});

console.log('\nJSON generation test completed successfully!');
