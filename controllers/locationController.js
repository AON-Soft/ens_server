const { Types } = require('mongoose')
const catchAsyncError = require('../middleware/catchAsyncError')
const locationModel = require('../models/locationModel')
const userModel = require('../models/userModel')
const ErrorHandler = require('../utils/errorhander')

exports.createLocatiion = catchAsyncError(async (req, res, next) => {
  const {title, subtitle} = req.body;

  try {
    const user = await userModel.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler('User not found.'))
    }
    const newData = {
      title,
      subtitle,
      userId: user._id
    }

    const result = await locationModel.create(newData);

    if(!result){
      return next(new ErrorHandler('faild to create location'))
    }

   res.status(201).json({ success: true, data: result || [] })

  } catch (error) {
    next(error)
  }
  
})

exports.updateLocation = catchAsyncError(async (req, res, next) => {
  try {
    let location = await locationModel.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
    if (!location) {
      return next(new ErrorHandler('location not found', 404))
    }

    res.status(200).json({ success: true, location: location })
  } catch (error) {
    next(error)
  }  
})

exports.deleteLocation = catchAsyncError(async (req, res, next) => {
  try {
    const location = await locationModel.findByIdAndDelete(req.params.id)

  if (!location) {
    return next(new ErrorHandler('location not found', 404))
  }

  res.status(200).json({ success: true, message: 'location deleted sucesfully' })
  } catch (error) {
    next(error)
  }
})

exports.getAllLocation = catchAsyncError(async (_, res, next) => {
  try {
    const allLocation = await locationModel.find().exec();

    if(!allLocation || allLocation.length < 1){
      res.status(404).json({success: false, data: []})
    }

    res.status(200).json({success: true, data: allLocation || []})

  } catch (error) {
   next(error) 
  }
  
})

exports.getSelfLocation = catchAsyncError(async (req, res, next) => {
  const userId = req.user.id
  try {
    const location = await locationModel.find({userId: userId}).exec();

    if(!location || location.length < 1){
      res.status(404).json({success: false, data: []})
    }

    res.status(200).json({success: true, data: location || []})

  } catch (error) {
   next(error) 
  }
  
})