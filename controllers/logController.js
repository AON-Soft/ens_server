const catchAsyncError = require('../middleware/catchAsyncError');
const logModel = require('../models/logModel');
const ApiFeatures = require('../utils/apifeature');

exports.getAllLog = catchAsyncError(async (req, res, next) => {
  let resultPerPage; 

  if (req.query.limit) {
   resultPerPage = parseInt(req.query.limit);
  }

  try{

    const count = await logModel.countDocuments()
    const apiFeature = new ApiFeatures(
      logModel.find()
      .populate({
        path: 'user',
        select: 'name email avatar role mobile'
      })
      .sort({ createdAt: -1 }),
      req.query,
    )
      .search()
      .filter()
      .pagination(resultPerPage)

    let logs = await apiFeature.query
    
    let filteredCount = logs.length

    if (!logs || logs.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        resultPerPage,
        filteredCount: 0,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      count,
      resultPerPage,
      filteredCount,
      data: logs,
    })
  }catch(error){
    next(error)
  }
});


