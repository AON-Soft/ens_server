const catchAsyncError = require('../middleware/catchAsyncError')
const tagModel = require('../models/tagModel')
const ErrorHandler = require('../utils/errorhander')

exports.createTag = catchAsyncError(async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id;
    const result = await tagModel.create(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 11000 && error.keyValue && error.keyValue.name) {
      return next(new ErrorHandler('Tag already exists.', 400));
    }
    next(error);
  }
});

exports.updateTag = catchAsyncError(async (req, res, next) => {
  try {
    const exist = await tagModel.findById(req.params.id);
    if (!exist) {
      return next(new ErrorHandler('Tag not found', 404));
    }
    const result = await tagModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

exports.deleteTag = catchAsyncError(async (req, res, next) => {
  try {
    const deleted = await tagModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return next(new ErrorHandler('Tag not found', 404));
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
});

exports.getAllTag = catchAsyncError(async (req, res, next) => {
  try {
    const result = await tagModel.find({ createdBy: req.user.id });
    res.status(200).json({ success: true, data: result || [] });
  } catch (error) {
    next(error);
  }
});


