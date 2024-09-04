const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { MONGO_URI } = require('../constant')

// Import all models
const User = require('../models/userModel')
const ShopCategory = require('../models/shopCategoryModel')
const Shop = require('../models/shopModel')
const Category = require('../models/categoryModel')
const Brand = require('../models/brandModel')
const Tag = require('../models/tagModel')
const Unit = require('../models/unitModel')
const Product = require('../models/productModel')
const Card = require('../models/cardModel')
const OrderedProduct = require('../models/orderedProductModel')
const OrderBalance = require('../models/orderBalanceModel')
const Transaction = require('../models/transactionModel')
const Campaign = require('../models/campaignModel')
const Notification = require('../models/notificationModel')
const Token = require('../models/tokenModel')
const Log = require('../models/logModel')
const ServiceCharge = require('../models/serviceChargeModel')

const seedDatabase = async () => {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 30000, // 30 seconds
  })
  console.log('MongoDB connected')

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    ShopCategory.deleteMany({}),
    Shop.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Tag.deleteMany({}),
    Unit.deleteMany({}),
    Product.deleteMany({}),
    Card.deleteMany({}),
    OrderedProduct.deleteMany({}),
    OrderBalance.deleteMany({}),
    Transaction.deleteMany({}),
    Campaign.deleteMany({}),
    Token.deleteMany({}),
    Notification.deleteMany({}),
    ServiceCharge.deleteMany({}),
    Log.deleteMany({}),
  ])

  // Seed Users
  const users = await User.create([
    {
      name: 'John Doe',
      email: 'john@example.com',
      mobile: '1234567890',
      password: await bcrypt.hash('password123', 10),
      role: 'user',
      balance: 1000,
      status: 'active',
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      mobile: '9876543210',
      password: await bcrypt.hash('password456', 10),
      role: 'shop_keeper',
      balance: 5000,
      status: 'active',
    },
    {
      name: 'Agent Cooper',
      email: 'agent@example.com',
      mobile: '5555555555',
      password: await bcrypt.hash('agentpass', 10),
      role: 'agent',
      balance: 3000,
      status: 'active',
    },
    {
      name: 'Admin User',
      email: 'admin@example.com',
      mobile: '1111111111',
      password: await bcrypt.hash('adminpass', 10),
      role: 'admin',
      balance: 10000,
      status: 'active',
    },
    {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      mobile: '9999999999',
      password: await bcrypt.hash('superadminpass', 10),
      role: 'super_admin',
      balance: 50000,
      status: 'active',
    },
  ])

  if (!users || users.length === 0) {
    throw new Error('Failed to create users')
  }

  // Seed Shop Categories
  const shopCategories = await ShopCategory.create([
    {
      name: 'Electronics',
      image: {
        public_id: 'shopCategories/electronics',
        url: 'https://example.com/electronics.jpg',
      },
      level: 0,
      createdBy: users[4]._id,
    },
    {
      name: 'Clothing',
      image: {
        public_id: 'shopCategories/clothing',
        url: 'https://example.com/clothing.jpg',
      },
      level: 0,
      createdBy: users[4]._id,
    },
    {
      name: 'Home & Garden',
      image: {
        public_id: 'shopCategories/home-garden',
        url: 'https://example.com/home-garden.jpg',
      },
      level: 0,
      createdBy: users[4]._id,
    },
  ])

  if (!shopCategories || shopCategories.length === 0) {
    throw new Error('Failed to create shop categories')
  }

  const subCategories = await ShopCategory.create([
    {
      name: 'Smartphones',
      parent: shopCategories[0]._id,
      level: 1,
      createdBy: users[4]._id,
    },
    {
      name: 'Laptops',
      parent: shopCategories[0]._id,
      level: 1,
      createdBy: users[4]._id,
    },
    {
      name: "Men's Wear",
      parent: shopCategories[1]._id,
      level: 1,
      createdBy: users[4]._id,
    },
    {
      name: "Women's Wear",
      parent: shopCategories[1]._id,
      level: 1,
      createdBy: users[4]._id,
    },
  ])

  // Add sub-subcategories (level 2)
  await ShopCategory.create([
    {
      name: 'Android Phones',
      parent: subCategories[0]._id,
      level: 2,
      createdBy: users[4]._id,
    },
    {
      name: 'iPhones',
      parent: subCategories[0]._id,
      level: 2,
      createdBy: users[4]._id,
    },
    {
      name: 'Gaming Laptops',
      parent: subCategories[1]._id,
      level: 2,
      createdBy: users[4]._id,
    },
    {
      name: 'Business Laptops',
      parent: subCategories[1]._id,
      level: 2,
      createdBy: users[4]._id,
    },
    {
      name: 'T-Shirts',
      parent: subCategories[2]._id,
      level: 2,
      createdBy: users[4]._id,
    },
    {
      name: 'Jeans',
      parent: subCategories[2]._id,
      level: 2,
      createdBy: users[4]._id,
    },
    {
      name: 'Dresses',
      parent: subCategories[3]._id,
      level: 2,
      createdBy: users[4]._id,
    },
    {
      name: 'Skirts',
      parent: subCategories[3]._id,
      level: 2,
      createdBy: users[4]._id,
    },
  ])

  // Seed Shops
  const shops = await Shop.create([
    {
      logo: {
        public_id: 'shops/janes-electronics',
        url: 'https://example.com/janes-electronics-logo.jpg',
      },
      userId: users[1]._id,
      name: "Jane's Electronics",
      info: 'Best electronics shop in town',
      category: shopCategories[0]._id,
      address: '123 Main St, City',
      status: 'Approved',
      createdBy: users[1]._id,
    },
    {
      logo: {
        public_id: 'shops/fashion-haven',
        url: 'https://example.com/fashion-haven-logo.jpg',
      },
      userId: users[1]._id,
      name: 'Fashion Haven',
      info: 'Your one-stop shop for trendy clothing',
      category: shopCategories[1]._id,
      address: '456 Style Ave, Town',
      status: 'Approved',
      createdBy: users[1]._id,
    },
  ])

  // Seed Categories (Product Categories)
  const categories = await Category.create([
    {
      name: 'Smartphones',
      shopCategory: shopCategories[0]._id,
      shopID: shops[0]._id,
      createdBy: users[1]._id,
    },
    {
      name: 'Laptops',
      shopCategory: shopCategories[0]._id,
      shopID: shops[0]._id,
      createdBy: users[1]._id,
    },
    {
      name: 'T-Shirts',
      shopCategory: shopCategories[1]._id,
      shopID: shops[1]._id,
      createdBy: users[1]._id,
    },
    {
      name: 'Dresses',
      shopCategory: shopCategories[1]._id,
      shopID: shops[1]._id,
      createdBy: users[1]._id,
    },
  ])

  // Seed Brands
  const brands = await Brand.create([
    {
      name: 'Apple',
      shopCategory: shopCategories[0]._id,
      shopID: shops[0]._id,
      createdBy: users[1]._id,
    },
    {
      name: 'Samsung',
      shopCategory: shopCategories[0]._id,
      shopID: shops[0]._id,
      createdBy: users[1]._id,
    },
    {
      name: 'Nike',
      shopCategory: shopCategories[1]._id,
      shopID: shops[1]._id,
      createdBy: users[1]._id,
    },
    {
      name: 'Adidas',
      shopCategory: shopCategories[1]._id,
      shopID: shops[1]._id,
      createdBy: users[1]._id,
    },
  ])

  // Seed Tags
  const tags = await Tag.create([
    { name: 'New Arrival', createdBy: users[1]._id },
    { name: 'Best Seller', createdBy: users[1]._id },
    { name: 'Sale', createdBy: users[1]._id },
  ])

  // Seed Units
  const units = await Unit.create([
    { name: 'Gram', abbreviation: 'g', createdBy: users[1]._id },
    { name: 'Kilogram', abbreviation: 'kg', createdBy: users[1]._id },
  ])

  // Seed Products
  const products = await Product.create([
    {
      name: 'iPhone 13',
      description: 'Latest iPhone model with advanced features',
      price: 999,
      commission: 50,
      images: 'https://example.com/iphone13.jpg',
      categoryId: categories[0]._id,
      brandId: brands[0]._id,
      stockUnit: 'pieces',
      availableStock: 100,
      user: users[1]._id,
      shop: shops[0]._id,
      tags: [tags[0]._id, tags[1]._id],
      unit: units[0]._id,
      status: 'live',
    },
    {
      name: 'Samsung Galaxy S21',
      description: 'Flagship Android smartphone',
      price: 899,
      commission: 45,
      images: 'https://example.com/galaxys21.jpg',
      categoryId: categories[0]._id,
      brandId: brands[1]._id,
      stockUnit: 'pieces',
      availableStock: 80,
      user: users[1]._id,
      shop: shops[0]._id,
      tags: [tags[1]._id],
      unit: units[0]._id,
      status: 'live',
    },
    {
      name: 'Nike Air Max',
      description: 'Comfortable and stylish sneakers',
      price: 129,
      commission: 15,
      images: 'https://example.com/nikeairmax.jpg',
      categoryId: categories[2]._id,
      brandId: brands[2]._id,
      stockUnit: 'pieces',
      availableStock: 50,
      user: users[1]._id,
      shop: shops[1]._id,
      tags: [tags[2]._id],
      unit: units[0]._id,
      status: 'live',
    },
  ])

  // Seed Cards (Shopping Carts)
  const cards = await Card.create([
    {
      userId: users[0]._id,
      shopID: shops[0]._id,
      cardProducts: [
        {
          productId: products[0]._id,
          productName: products[0].name,
          productImage: products[0].images,
          productQuantity: 1,
          price: products[0].price,
          totalPrice: products[0].price,
          commission: products[0].commission,
          totalCommission: products[0].commission,
        },
      ],
    },
  ])

  // Seed Ordered Products
  const orderedProducts = await OrderedProduct.create([
    {
      userId: users[0]._id,
      shopID: shops[0]._id,
      cardId: cards[0]._id,
      cardProducts: cards[0].cardProducts,
      totalBill: cards[0].cardProducts[0].totalPrice,
      totalCommissionBill: cards[0].cardProducts[0].totalCommission,
      orderStatus: 'pending',
      paymentStatus: 'unpaid',
      shippingAddress: '789 Customer St, City',
      orderID: 'ORD-001',
    },
  ])

  // Seed Order Balance
  await OrderBalance.create([
    {
      amount: orderedProducts[0].totalBill,
      commision: orderedProducts[0].totalCommissionBill,
      orderId: orderedProducts[0]._id,
      cardId: cards[0]._id,
      shopId: shops[0]._id,
      user: users[0]._id,
      shopKeeper: users[1]._id,
    },
  ])

  // Seed Transactions
  await Transaction.create([
    {
      transactionID: 'TRX-001',
      transactionAmount: orderedProducts[0].totalBill,
      serviceCharge: 5,
      sender: {
        user: users[0]._id,
        name: users[0].name,
        email: users[0].email,
        flag: 'user',
        transactionHeading: 'Payment for order',
      },
      receiver: {
        user: users[1]._id,
        name: users[1].name,
        email: users[1].email,
        flag: 'shop_keeper',
        transactionHeading: 'Order payment received',
      },
      paymentType: 'points',
      invoiceID: 'INV-001',
      transactionType: 'payment',
      transactionRelation: 'user-To-shop_keeper',
    },
  ])

  // Seed Campaigns
  await Campaign.create([
    {
      campaignTitle: 'Summer Sale',
      title: 'Get 20% off on all electronics',
      body: "Don't miss our biggest sale of the year!",
      bgImage: 'https://example.com/summer-sale-banner.jpg',
      payload: { discount: 20 },
      total: 1000,
      total_sent: 500,
      total_processed: 450,
      total_failed: 50,
      duration: 7,
    },
  ])

  // Seed Notifications
  await Notification.create([
    {
      userId: users[0]._id,
      orderId: orderedProducts[0]._id,
      status: 'success',
      notificationType: 'order',
      isRead: false,
    },
  ])

  // Seed Tokens
  await Token.create([
    {
      userId: users[2]._id,
      tokenName: 'Discount Token',
      tokenPrice: 50,
      isUsed: false,
    },
  ])

  // Seed Service Charges
  await ServiceCharge.create([
    {
      cashoutCharge: 20,
      sendMoneyCharge: 5,
      tokenCharge: 40,
    },
  ])

  // Seed Logs
  await Log.create([
    {
      event: 'login:success',
      user: users[0]._id,
      payload: 'User logged in successfully',
      remarks: 'Login from mobile app',
    },
  ])

  console.log('Seed data created successfully')

  await mongoose.disconnect()
  console.log('MongoDB disconnected')
}

seedDatabase()
