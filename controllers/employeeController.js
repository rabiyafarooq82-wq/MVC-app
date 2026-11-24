const jwt = require("jsonwebtoken");
const Employee = require("../models/Employee");

// --- Helper Functions ---
const createAuthToken = (empId, empRole) => {
  return jwt.sign({ id: empId, role: empRole }, process.env.JWT_SECRET, { expiresIn: "1d" });
};

const filterSensitiveData = (empData, isAdmin = false) => {
  if (!empData) return null;
  const { password, ...safeData } = empData;
  
  // Agar admin hai toh sab dikhao, warna limited data
  if (isAdmin) return safeData;
  return { 
    id: safeData.id, 
    name: safeData.name, 
    role: safeData.role, 
    department: safeData.department, 
    joinedAt: safeData.joinedAt 
  };
};

// --- Middleware ---
const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employee = Employee.findById(decoded.id);
    
    if (!employee) return res.status(401).json({ error: "Employee not found" });
    
    req.employee = employee; // req.user ki jagah req.employee use kiya
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.employee.role)) {
      return res.status(403).json({ error: "Permission denied. Unauthorized role." });
    }
    next();
  };
};

// --- Auth Controllers ---
const registerEmployee = async (req, res, next) => {
  try {
    const { name, email, password, role, department, secretKey } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }
    
    if (Employee.findByEmail(email)) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    let assignedRole = "employee"; // Default role 'employee' kar diya hai

    if (role === "admin") {
      const adminPresent = Employee.findAll().some((emp) => emp.role === "admin");
      if (adminPresent && secretKey !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ error: "Invalid admin secret key" });
      }
      assignedRole = "admin";
    }

    const newEmp = await Employee.create(name, email, password, assignedRole, department);
    
    res.status(201).json({
      message: "Registration successful",
      token: createAuthToken(newEmp.id, newEmp.role),
      employee: filterSensitiveData(newEmp, true),
    });
  } catch (err) { next(err); }
};

const loginEmployee = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const employee = Employee.findByEmail(email);
    
    if (!employee || !(await Employee.verifyPassword(password, employee.password))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    res.json({ 
      message: "Login successful", 
      token: createAuthToken(employee.id, employee.role), 
      employee: filterSensitiveData(employee, true) 
    });
  } catch (err) { next(err); }
};

// --- User/Employee Controllers ---
const getProfile = (req, res) => {
  res.json({ profile: filterSensitiveData(req.employee, true) });
};

const updateProfile = async (req, res) => {
  const { name, email, password, department } = req.body;
  const updatedEmp = await Employee.update(req.employee.id, { name, email, password, department });
  res.json({ message: "Profile updated successfully", profile: filterSensitiveData(updatedEmp, true) });
};

const requestAccountDeletion = async (req, res) => {
  if (req.employee.isDeletionRequested) {
    return res.status(400).json({ error: "Deletion request is already pending" });
  }
  await Employee.update(req.employee.id, { isDeletionRequested: true });
  res.json({ message: "Account deletion request submitted for admin approval" });
};

// --- Admin Controllers ---
const fetchAllEmployees = (req, res) => {
  const isAdmin = req.employee.role === "admin";
  const employees = Employee.findAll().map((emp) => filterSensitiveData(emp, isAdmin));
  res.json({ total: employees.length, employees });
};

const fetchEmployeeById = (req, res) => {
  const employee = Employee.findById(req.params.id);
  if (!employee) return res.status(404).json({ error: "Employee not found" });
  res.json({ employee: filterSensitiveData(employee, req.employee.role === "admin") });
};

const adminUpdateEmployee = async (req, res) => {
  const { name, email, role, password, department } = req.body;
  const updatedEmp = await Employee.update(req.params.id, { name, email, role, password, department });
  if (!updatedEmp) return res.status(404).json({ error: "Employee not found" });
  res.json({ message: "Employee record updated by Admin", employee: filterSensitiveData(updatedEmp, true) });
};

const adminDeleteEmployee = (req, res) => {
  if (Employee.delete(req.params.id)) res.json({ message: "Employee deleted permanently" });
  else res.status(404).json({ error: "Employee not found" });
};

const viewDeletionRequests = (req, res) => {
  const pending = Employee.findAll().filter((emp) => emp.isDeletionRequested);
  res.json({ count: pending.length, requests: pending.map((emp) => filterSensitiveData(emp, true)) });
};

const approveDeletion = (req, res) => {
  if (Employee.delete(req.params.id)) res.json({ message: "Deletion approved. Account removed." });
  else res.status(404).json({ error: "Employee not found" });
};

module.exports = {
  registerEmployee, loginEmployee, verifyToken, checkRole,
  getProfile, updateProfile, requestAccountDeletion,
  fetchAllEmployees, fetchEmployeeById, adminUpdateEmployee, adminDeleteEmployee, viewDeletionRequests, approveDeletion
};