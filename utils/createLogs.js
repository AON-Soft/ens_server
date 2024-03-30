const logModel = require("../models/logModel");

const createLog = (event, user, payload, remarks) => {
  const newLog = new logModel({
    event: event,
    user: user,
    payload: payload,
    remarks: remarks,
  });

  return newLog.save();
};

module.exports = createLog;
