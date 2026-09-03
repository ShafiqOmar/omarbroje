const ROLES = { 1: 'ADMIN', 2: 'PROVIDER', 3: 'CHARITY', 4: 'VOLUNTEER' };

module.exports = (...allowedRoles) => (req, res, next) => {
  const userRole = ROLES[req.user.roleId];
  if (!allowedRoles.includes(userRole))
    return res.status(403).json({ message: 'Access denied' });
  next();
};