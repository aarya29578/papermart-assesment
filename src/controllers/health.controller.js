/**
 * Health check controller
 * Confirms API operational status
 */
export const getHealth = (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Reliable Paper Mart AI Assistant API is running',
  });
};
