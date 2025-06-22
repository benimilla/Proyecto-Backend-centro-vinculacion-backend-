// middlewares/permissions.middleware.js
module.exports = function (requiredRole) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: 'Permiso denegado' });
    }
    next();
  };
};
