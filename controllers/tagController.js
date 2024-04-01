const catchAsyncError = require('../middleware/catchAsyncError')
const tagModel = require('../models/tagModel');
const createLog = require('../utils/createLogs');
const ErrorHandler = require('../utils/errorhander')

exports.createTag = catchAsyncError(async (req, res, next) => {
  try {
    let createdBy = req.user.id; 

    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      createdBy = null;
    }

    const tagData = { ...req.body, createdBy }; 

    const result = await tagModel.create(tagData);
    await createLog('tag_add', req.user.id, 'Add Tag', 'New Tag Added');
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
    await createLog('tag_edit', req.user.id, 'Update Tag', 'Tag Update Success');
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
    await createLog('tag_delete', req.user.id, 'Delete Tag', 'Tag Delete Success');
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
});

exports.getAllTag = catchAsyncError(async (req, res, next) => {
  try {
    let query;
    if (req.user.role === 'admin' || req.user.role === 'super_admin') {
      query = {};
    } else {
      query = { createdBy: req.user.id };
    }
    const result = await tagModel.find(query);
    res.status(200).json({ success: true, data: result || [] });
  } catch (error) {
    next(error);
  }
});


