const express = require('express');
const router = express.Router();
const empCtrl = require('../controllers/employeeController');

/* =========================================
   PUBLIC ROUTES (No Token Required)
========================================= */
// Maine signup ki jagah /register use kiya hai
router.post('/register', empCtrl.registerEmployee);
router.post('/login', empCtrl.loginEmployee);

/* =========================================
   PROTECTED ROUTES (Token Required)
========================================= */
// Middleware lagaya hai jo har request par token check karega
router.use(empCtrl.verifyToken);

/* --- Employee Self-Service Routes --- */
// Maine /me ki jagah /profile use kiya hai
router.get('/profile', empCtrl.getProfile);
router.patch('/profile', empCtrl.updateProfile);
router.delete('/profile/request-deletion', empCtrl.requestAccountDeletion);

/* --- Admin Exclusive Routes --- */
// Admin routes ko alag se /admin prefix de diya hai
router.get('/admin/deletion-requests', empCtrl.checkRole('admin'), empCtrl.viewDeletionRequests);
router.patch('/admin/approve-deletion/:id', empCtrl.checkRole('admin'), empCtrl.approveDeletion);

// Admin modifying other employees
router.patch('/employees/:id', empCtrl.checkRole('admin'), empCtrl.adminUpdateEmployee);
router.delete('/employees/:id', empCtrl.checkRole('admin'), empCtrl.adminDeleteEmployee);

/* =========================================
   GENERAL VIEW ROUTES
========================================= */
// Ye routes hamesha aakhir mein aayenge taake /:id conflict na kare
router.get('/employees', empCtrl.fetchAllEmployees);
router.get('/employees/:id', empCtrl.fetchEmployeeById);

module.exports = router;