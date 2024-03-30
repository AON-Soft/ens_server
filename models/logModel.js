const mongoose = require('mongoose');

// Enum values
const Logs_enum = [
  'login:failed', 
  'login:success',
  'logout:success', 
  'product_add',
  'product_edit',
  'product_delete',
  'shop_add',
  'shop_edit',
  'shop_delete',
  'user-To-user',
  'user-To-agent',
  'user-To-shop_keeper',
  'user-To-admin',
  'agent-To-agent',
  'agent-To-admin',
  'agent-To-user',
  'agent-To-shop_keeper',
  'admin-To-admin',
  'admin-To-agent',
  'shop_keeper-To-agent',
  'user-To-super_admin',
  'agent-To-super_admin',
  'shop_keeper-To-super_admin',
  'admin-To-super_admin',
  'super_admin-To-user',
  'super_admin-To-agent',
  'super_admin-To-shop_keeper',
  'super_admin-To-admin',
  'super_admin-To-super_admin',
  'shop_keeper-To-user'
];

// Create the Mongoose schema
const logSchema = new mongoose.Schema({
  event: {
    type: String,
    default: 'get',
    enum: Logs_enum,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  payload: {
    type: String,
  },
  remarks: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Logs', logSchema);
