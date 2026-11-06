export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
export function createNotification(db, userId, message) {
  return db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [userId, message]);
}
