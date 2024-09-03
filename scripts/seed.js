const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

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
  try {
    await mongoose.connect(
      'mongodb+srv://yamin:1234567890@cluster0.r4doz.mongodb.net/ens_server',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000, // 30 seconds
      },
    )
    console.log('MongoDB connected')

    // Your seeding logic here...

    // Clear existing data
    await User.deleteMany({})
    await Shop.deleteMany({})
    await Product.deleteMany({})
    await Category.deleteMany({})
    await Brand.deleteMany({})
    await Tag.deleteMany({})
    await Unit.deleteMany({})
    await OrderedProduct.deleteMany({})
    await Card.deleteMany({})
    await Transaction.deleteMany({})
    await OrderBalance.deleteMany({})
    await Campaign.deleteMany({})
    await Token.deleteMany({})
    await Notification.deleteMany({})
    await ServiceCharge.deleteMany({})
    await Log.deleteMany({})

    // Create users
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
        name: 'John Doe 02',
        email: 'john02@example.com',
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
        name: 'Jane Smith Agent',
        email: 'janeagent@example.com',
        mobile: '9876543210',
        password: await bcrypt.hash('password456', 10),
        role: 'agent',
        balance: 5000,
        status: 'active',
      },
      {
        name: 'Admin User',
        email: 'admin@example.com',
        mobile: '5555555555',
        password: await bcrypt.hash('adminpass', 10),
        role: 'admin',
        balance: 10000,
        status: 'active',
      },
      {
        name: 'Super Admin User',
        email: 'superadmin@example.com',
        mobile: '5555555555',
        password: await bcrypt.hash('superadminpass', 10),
        role: 'super_admin',
        balance: 10000,
        status: 'active',
      },
    ])

    // Create shop categories
    const shopCategories = await ShopCategory.create([
      { name: 'Electronics', createdBy: users[2]._id },
      { name: 'Clothing', createdBy: users[2]._id },
      { name: 'Groceries', createdBy: users[2]._id },
    ])

    // Create shops
    const shops = await Shop.create([
      {
        logo: {
          public_id:
            'abstract-autumn-beauty-multi-colored-leaf-vein-pattern-generated-by-ai_188544-9871',
          url: 'https://img.freepik.com/free-photo/abstract-autumn-beauty-multi-colored-leaf-vein-pattern-generated-by-ai_188544-9871.jpg',
        },
        userId: users[1]._id,
        name: "Jane's Electronics",
        info: 'Best electronics shop in town',
        category: shopCategories[0]._id,
        address: '123 Main St, City',
        status: 'Approved',
        createdBy: users[1]._id,
      },
    ])

    // Create categories
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
    ])

    // Create brands
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
    ])

    // Create tags
    const tags = await Tag.create([
      { name: 'New Arrival', createdBy: users[1]._id },
      { name: 'Best Seller', createdBy: users[1]._id },
    ])

    // Create units
    const units = await Unit.create([
      { name: 'Gram', abbreviation: 'g', createdBy: users[1]._id },
      { name: 'Kilogram', abbreviation: 'kg', createdBy: users[1]._id },
    ])

    // Create products
    const products = await Product.create([
      {
        name: 'iPhone 12',
        description: 'Latest iPhone model',
        price: 999,
        commission: 50,
        images:
          'https://img.freepik.com/free-photo/abstract-autumn-beauty-multi-colored-leaf-vein-pattern-generated-by-ai_188544-9871.jpg',
        categoryId: categories[0]._id,
        brandId: brands[0]._id,
        stockUnit: 'pieces',
        availableStock: 100,
        user: users[1]._id,
        shop: shops[0]._id,
        tags: [tags[0]._id],
        unit: units[0]._id,
        status: 'live',
      },
      {
        name: 'Samsung Galaxy S21',
        description: 'Flagship Android smartphone',
        price: 899,
        commission: 45,
        images:
          'https://img.freepik.com/free-photo/abstract-autumn-beauty-multi-colored-leaf-vein-pattern-generated-by-ai_188544-9871.jpg',
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
    ])

    // Create cards
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

    // Create ordered products
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
        shippingAddress: '456 Oak St, City',
        orderID: 'ORD-001',
      },
    ])

    // Create order balance
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

    // Create transactions
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

    // Create campaigns
    await Campaign.create([
      {
        campaignTitle: 'Summer Sale',
        title: 'Get 20% off on all electronics',
        body: "Don't miss our biggest sale of the year!",
        bgImage:
          'https://img.freepik.com/free-photo/abstract-autumn-beauty-multi-colored-leaf-vein-pattern-generated-by-ai_188544-9871.jpg',
        payload: { discount: 20 },
        total: 1000,
        total_sent: 500,
        total_processed: 450,
        total_failed: 50,
        duration: 7,
      },
    ])

    // Create notifications
    await Notification.create([
      {
        userId: users[0]._id,
        orderId: orderedProducts[0]._id,
        status: 'success',
        notificationType: 'order',
        isRead: false,
      },
    ])

    // Create tokens
    await Token.create([
      {
        userId: users[2]._id,
        tokenName: 'Discount Token',
        tokenPrice: 50,
        isUsed: false,
      },
    ])

    // Create service charges
    await ServiceCharge.create([
      {
        cashoutCharge: 20,
        sendMoneyCharge: 5,
        tokenCharge: 40,
      },
    ])

    // Create logs
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
  } catch (err) {
    console.error('Error connecting to MongoDB:', err)
  }
}

seedDatabase()
