const catchAsyncError = require('../middleware/catchAsyncError')
const unitModel = require('../models/unitModel');
const createLog = require('../utils/createLogs');
const ErrorHandler = require('../utils/errorhander')

exports.createUnit = catchAsyncError(async (req, res, next) => {
   try {
    let createdBy = req.user.id; 

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      createdBy = null;
    }

    const unitData = { ...req.body, createdBy }; 

    const result = await unitModel.create(unitData);
    await createLog('unit_add', req.user.id, 'Add Unit', 'New Unit Added');
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 11000 && error.keyValue && error.keyValue.name) {
      return next(new ErrorHandler('Tag already exists.', 400));
    }
    next(error);
  }
});

exports.updateUnit = catchAsyncError(async (req, res, next) => {
  try {
    const exist = await unitModel.findById(req.params.id);
    if (!exist) {
      return next(new ErrorHandler('Unit not found', 404));
    }
    const result = await unitModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });
    await createLog('unit_edit', req.user.id, 'Update Unit', 'Unit Update Success');
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

exports.deleteUnit = catchAsyncError(async (req, res, next) => {
  try {
    const deleted = await unitModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return next(new ErrorHandler('Unit not found', 404));
    }
    await createLog('unit_delete', req.user.id, 'Delete Unit', 'Unit Delete Success');
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
});

exports.getAllUnit = catchAsyncError(async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      query = {};
    } else {
      query = { createdBy: req.user.id };
    }
    const result = await unitModel.find(query);
    res.status(200).json({ success: true, data: result || [] });
  } catch (error) {
    next(error);
  }
});

