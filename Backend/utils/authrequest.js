function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send('Access denied. No token.');

    try {
      const decoded = jwt.verify(token, 'your-secret-key');
      const userRoles = Array.isArray(decoded.roles) ? decoded.roles : [decoded.roles];

      const hasRole = allowedRoles.some(role => userRoles.includes(role));
      if (!hasRole) return res.status(403).send('Forbidden.');

      req.user = decoded;
      next();
    } catch (err) {
      res.status(400).send('Invalid token.');
    }
  };
}
