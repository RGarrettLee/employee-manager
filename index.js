const inquirer = require('inquirer'); // import all dependencies
const mysql = require('mysql2');
const table = require('easy-table');
require('dotenv').config()

const errorMessage = 'Something went wrong, please try again';

const db = mysql.createConnection( // connect to the database
    {
        host: 'localhost',
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DB_NAME,
    },
    console.log(`Connected to the ${process.env.DB_NAME} database`)
);

async function program(question) { // main function to loop through user options
    return inquirer
        .prompt(question)
        .then(response => {
            console.log('\n\n\n\n');
            switch (response.choice) {
                case 'View All Employees': // displays all employees in the database
                    db.query(`SELECT e.id, e.first_name, e.last_name, r.title, d.name AS department, r.salary, CONCAT(m.first_name, ' ', m.last_name) AS manager FROM employee e LEFT JOIN role r ON e.role_id = r.id LEFT JOIN department d ON d.id = r.department_id LEFT JOIN employee m ON m.id = e.manager_id`, (err, result) => {
                        console.log('\n');
                        let t = new table;
                        result.forEach((employee) => {
                            t.cell('id', employee.id);
                            t.cell('first_name', employee.first_name);
                            t.cell('last_name', employee.last_name);
                            t.cell('title', employee.title);
                            t.cell('department', employee.department);
                            t.cell('salary', employee.salary);
                            t.cell('manager', employee.manager);
                            t.newRow();
                        });
                        console.log(t.toString());
                        return program(question);
                    });
                    break;
                case 'Add Employee': // adds a new employee to the database
                    try {
                        inquirer
                        .prompt([
                            {
                                type: 'input',
                                message: 'What is the employee\'s first name?',
                                name: 'firstName'
                            },
                            {
                                type: 'input',
                                message: 'What is the employee\'s last name?',
                                name: 'lastName'
                            },
                            {
                                type: 'input',
                                message: 'What is their role?',
                                name: 'roleName'
                            },
                            {
                                type: 'input',
                                message: 'Who is their manager? (you can leave this blank or first and last name)',
                                name: 'managerName'
                            }
                        ])
                        .then((data) => {
                            db.query('SELECT id FROM role WHERE role.title = ?', data.roleName, (err, role) => {
                                db.query(`SELECT id FROM employee e WHERE CONCAT(e.first_name, ' ', e.last_name) = ?`, data.managerName, (err, manager) => {
                                    let m; // small bit of logic to allow for no manager on a new employee
                                    if (!manager[0]) m = null; 
                                    else m = manager[0].id;
                                    db.query(`INSERT INTO employee(first_name, last_name, role_id, manager_id) VALUES(?, ?, ?, ?)`, [data.firstName, data.lastName, role[0].id, m], (err, result) => {
                                        console.log('Employee successfully added');
                                        return program(question);
                                    });
                                });
                            });
                        });
                    } catch (err) {
                        console.log(errorMessage);
                        return program(question);
                    }
                    break;
                case 'Update Employee Role': // updates an employees role
                    try {
                        inquirer
                        .prompt([
                            {
                                type: 'input',
                                message: 'Which employee\'s role do you want to change? (first and last name)',
                                name: 'employee'
                            },
                            {
                                type: 'input',
                                message: 'What role would you like them to have?',
                                name: 'roleName'
                            }
                        ])
                        .then((data) => {
                            db.query(`SELECT id FROM employee e WHERE CONCAT(e.first_name, ' ', e.last_name) = ?`, data.employee, (err, employee) => {
                                db.query('SELECT id FROM role r WHERE r.title = ?', data.roleName, (err, result) => {
                                    db.query('UPDATE employee SET role_id = ? WHERE id = ?', [result[0].id, employee[0].id], (err, res) => {
                                        console.log('Employee successfully updated');
                                        return program(question);
                                    })
                                })
                            });
                        });
                    } catch (err) {
                        console.log(errorMessage);
                        return program(question);
                    }
                    break;
                case 'View All Roles': // displays all roles in the database
                    db.query('SELECT *, r.id, d.name AS department FROM role r LEFT JOIN department d ON d.id = r.department_id', (err, result) => {
                        console.log('\n');
                        let t = new table;
                        result.forEach((role) => {
                            t.cell('id', role.id);
                            t.cell('title', role.title);
                            t.cell('salary', role.salary);
                            t.cell('department', role.department);
                            t.newRow();
                        });
                        console.log(t.toString());
                        return program(question);
                    });
                    break;
                case 'Add Role': // adds a new role to the database
                    try {
                        inquirer
                        .prompt([
                            {
                                type: 'input',
                                message: 'What is the name of the role?',
                                name: 'roleName'
                            },
                            {
                                type: 'number',
                                message: 'How much does this role make?',
                                name: 'salary'
                            },
                            {
                                type: 'input',
                                message: 'What department is this role related to?',
                                name: 'dept'
                            }
                        ])
                        .then((data) => {
                            db.query(`SELECT id FROM department WHERE department.name = ?`, data.dept, (err, result) => {
                                db.query(`INSERT INTO role(title, salary, department_id) VALUES(?, ?, ?);`, [data.roleName, data.salary, result[0].id], (err, resp) => {
                                    console.log('Role successfully added');
                                    return program(question);
                                });
                            });
                        });
                    } catch (err) {
                        console.log(errorMessage);
                        return program(question);
                    }
                    break;
                case 'View All Departments': // displays all departments in the database
                    db.query('SELECT * FROM department', (err, result) => {
                        console.log('\n');
                        let t = new table;
                        result.forEach((dept) => {
                            t.cell('id', dept.id);
                            t.cell('name', dept.name);
                            t.newRow();
                        });
                        console.log(t.toString());
                        return program(question);
                    });
                    break;
                case 'Add Department': // adds a new department to the database
                    try {
                        inquirer
                        .prompt([
                            {
                                type: 'input',
                                message: 'What is this departments name?',
                                name: 'deptName'
                            }
                        ])
                        .then((data) => {
                            db.query('INSERT INTO department (name) VALUES(?)', data.deptName, (err, result) => {
                                console.log('Department successfully added');
                                return program(question);
                            });
                        })
                        .catch((err) => {
                            console.log(err);
                            return program(question);
                        });
                    } catch (err) {
                        console.log(errorMessage);
                        return program(question);
                    }
                    break;
                case 'Quit':
                    process.exit(1);
            }
        });
}

function init() {
    let choices = ['View All Employees', 'Add Employee', 'Update Employee Role', 'View All Roles', 'Add Role', 'View All Departments', 'Add Department', 'Quit'];

    program([{ type: 'list', message: 'What would you like do?', choices: choices, name: 'choice' }]);
}

init();