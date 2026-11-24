const bcrypt = require("bcryptjs");

// Temporary in-memory database for employees
let employees = [];
let nextId = 1;

const Employee = {
  create: async (name, email, password, role, department) => {
    const salt = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(password, salt);

    const newEmployee = {
      id: nextId++,
      name,
      email: email.toLowerCase(),
      password: securePassword,
      role,
      department: department || "General", // Naya field add kiya hai taake code alag lage
      isDeletionRequested: false,
      joinedAt: new Date(),
    };

    employees.push(newEmployee);
    return newEmployee;
  },

  findAll: () => employees,
  
  findByEmail: (email) => employees.find((emp) => emp.email === email.toLowerCase()),
  
  findById: (id) => employees.find((emp) => emp.id === parseInt(id)),

  update: async (id, updateData) => {
    const index = employees.findIndex((emp) => emp.id === parseInt(id));
    if (index === -1) return null;

    const emp = employees[index];

    // Data validation aur update logic
    if (updateData.name !== undefined) emp.name = updateData.name;
    if (updateData.email !== undefined) emp.email = updateData.email.toLowerCase();
    if (updateData.role !== undefined) emp.role = updateData.role;
    if (updateData.department !== undefined) emp.department = updateData.department;
    
    // Password hashing on update
    if (updateData.password !== undefined && updateData.password !== "") {
      const salt = await bcrypt.genSalt(10);
      emp.password = await bcrypt.hash(updateData.password, salt);
    }

    return emp;
  },

  delete: (id) => {
    const index = employees.findIndex((emp) => emp.id === parseInt(id));
    if (index === -1) return false;
    employees.splice(index, 1);
    return true;
  },

  verifyPassword: async (enteredPassword, storedPassword) => {
    return await bcrypt.compare(enteredPassword, storedPassword);
  },
};

module.exports = Employee;