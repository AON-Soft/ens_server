const catchAsyncError = require('../middleware/catchAsyncError');
const serviceChargeModel = require('../models/serviceChargeModel');
const ErrorHandler = require('../utils/errorhander')

exports.createServiceCharge = catchAsyncError(async (req, res, next) => {
   try {
    const existingServiceCharge = await serviceChargeModel.findOne();
    if (existingServiceCharge) {
      const result = await serviceChargeModel.findOneAndUpdate({}, req.body, { 
        new: true,
        runValidators: true,
        useFindAndModify: false 
      });
      res.status(200).json({ success: true, data: result });
    } else {
      const result = await serviceChargeModel.create(req.body);
      res.status(201).json({ success: true, data: result });
    }
  } catch (error) {
    if (error.code === 11000 && error.keyValue && error.keyValue.name) {
      return next(new ErrorHandler('Service charge already exists.', 400));
    }
    next(error);
  }
});

exports.updateServiceCharge = catchAsyncError(async (req, res, next) => {
  try {
    const exist = await serviceChargeModel.findById(req.params.id);
    if (!exist) {
      return next(new ErrorHandler('Service charge not found', 404));
    }
    const result = await serviceChargeModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

exports.deleteServiceCharge = catchAsyncError(async (req, res, next) => {
  try {
    const deleted = await serviceChargeModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return next(new ErrorHandler('Service charge not found', 404));
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
});

exports.getAllServiceCharge = catchAsyncError(async (_, res, next) => {
  try {
    const result = await serviceChargeModel.find().exec();
    res.status(200).json({ success: true, data: result || [] });
  } catch (error) {
    next(error);
  }
});


