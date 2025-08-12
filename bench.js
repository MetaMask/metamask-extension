// JSON Benchmark Extension - measures JSON.stringify vs direct JSON sending

// Generate a complex JSON object with nested structures
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
      schema: 'benchmark_data_v2',
      generators: {
        categories: categories.length,
        colors: colors.length,
        statuses: statuses.length,
        names: firstNames.length * lastNames.length
      }
    },

    users: [],
    products: [],
    orders: [],
    analytics: {
      daily: [],
      monthly: [],
      yearly: []
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
      },
      endpoints: [
        { name: 'api', url: 'https://api.example.com', timeout: 5000 },
        { name: 'auth', url: 'https://auth.example.com', timeout: 3000 },
        { name: 'cdn', url: 'https://cdn.example.com', timeout: 10000 }
      ]
    }
  };

  // Generate users
  const userCount = Math.max(1, Math.floor(targetItems * 0.2));
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
  const productCount = Math.max(1, Math.floor(targetItems * 0.3));
  for (let i = 0; i < productCount; i++) {
    data.products.push({
      id: `product_${i + 1}`,
      name: `Product ${i + 1}`,
      category: categories[i % categories.length],
      price: parseFloat((9.99 + (i % 1000) * 0.50).toFixed(2)),
      description: `This is a detailed description for product ${i + 1}. It includes many features and benefits that make it a great choice.`,
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
      },
      reviews: Array.from({ length: Math.min(5, i % 6) }, (_, j) => ({
        id: `review_${i}_${j}`,
        rating: 1 + (j + i) % 5,
        comment: `Review ${j + 1} for product ${i + 1}`,
        userId: `user_${(i + j) % userCount + 1}`,
        date: new Date(Date.now() - (i + j) * 86400000).toISOString()
      }))
    });
  }

  // Generate orders
  const orderCount = Math.max(1, Math.floor(targetItems * 0.5));
  for (let i = 0; i < orderCount; i++) {
    const itemCount = 1 + (i % 5);
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
        },
        trackingNumber: `TRACK${String(i + 1000).padStart(6, '0')}`
      },
      payment: {
        method: i % 4 === 0 ? 'credit' : i % 4 === 1 ? 'debit' : i % 4 === 2 ? 'paypal' : 'apple_pay',
        last4: String(1234 + (i % 9000)).slice(-4),
        processed: i % 10 !== 9
      },
      timestamps: {
        created: new Date(Date.now() - i * 3600000).toISOString(),
        updated: new Date(Date.now() - i * 1800000).toISOString(),
        shipped: i % 3 === 0 ? new Date(Date.now() - i * 900000).toISOString() : null
      }
    });
  }

  // Generate analytics data
  for (let i = 0; i < 30; i++) {
    data.analytics.daily.push({
      date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
      visitors: 100 + (i % 500),
      pageViews: 300 + (i % 2000),
      bounceRate: parseFloat((0.2 + (i % 50) * 0.01).toFixed(2)),
      conversionRate: parseFloat((0.02 + (i % 20) * 0.001).toFixed(3)),
      revenue: parseFloat((500 + (i % 5000)).toFixed(2))
    });
  }

  for (let i = 0; i < 12; i++) {
    data.analytics.monthly.push({
      month: new Date(2024, i, 1).toISOString().split('T')[0].slice(0, 7),
      visitors: 3000 + (i % 15000),
      pageViews: 9000 + (i % 60000),
      avgSessionDuration: 120 + (i % 300),
      revenue: parseFloat((15000 + (i % 150000)).toFixed(2))
    });
  }

  return data;
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateComplexJsonObject };
}
