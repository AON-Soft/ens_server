const calculateServiceCharge = async (amount, percentage) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new Error('Invalid input: amount must be a number')
  }

  const serviceCharge = amount * (percentage / 1000)
  if (typeof serviceCharge !== 'number' || isNaN(serviceCharge)) {
    throw new Error(
      'Unexpected error: service charge calculation resulted in a non-numeric value',
    )
  }

  return Number(serviceCharge)
}

module.exports = calculateServiceCharge
