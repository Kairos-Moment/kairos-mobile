// A simple middleware to check if the user is authenticated
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      // If user is authenticated, continue to the next middleware/route handler
      return next();
    }
    // If not authenticated, send an unauthorized status
    res.status(401).json({ message: 'You are not authorized to view this resource.' });
  };
  
  module.exports = { ensureAuthenticated };