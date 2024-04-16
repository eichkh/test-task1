const { Client } = require("pg");

class Database {
    constructor(config) {
        this.client = new Client(config);
    }

    async connect() {
        try {
            await this.client.connect();
        } catch (error) {
            console.error("Error connecting to PostgreSQL database:", error);
            throw error;
        }
    }

    async createTables() {
        await this.query(`
            DROP TABLE IF EXISTS salaries;
            DROP TABLE IF EXISTS donations;
            DROP TABLE IF EXISTS employees;
            DROP TABLE IF EXISTS departments;
        `);

        try {
            await this.query(`
                CREATE TABLE departments (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL
                )
            `);

            await this.query(`
                CREATE TABLE employees (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    surname VARCHAR(255) NOT NULL,
                    department_id INT NOT NULL,
                    FOREIGN KEY (department_id) REFERENCES departments(id)
                )
            `);

            await Promise.all([
                this.query(`
                        CREATE TABLE salaries (
                        id SERIAL PRIMARY KEY,
                        employee_id INT NOT NULL,
                        amount NUMERIC NOT NULL,
                        date TIMESTAMP NOT NULL,
                        FOREIGN KEY (employee_id) REFERENCES employees(id)
                    )
                `),
                this.query(`
                        CREATE TABLE donations (
                        id SERIAL PRIMARY KEY,
                        employee_id INT NOT NULL,
                        amount NUMERIC NOT NULL,
                        currency VARCHAR(3) NOT NULL,
                        date TIMESTAMP NOT NULL,
                        FOREIGN KEY (employee_id) REFERENCES employees(id)
                    )
                `),
            ]);
        } catch (error) {
            console.error(
                "Error creating tables in PostgreSQL database:",
                error
            );
            throw error;
        }
    }

    async insertDepartment(department) {
        try {
            await this.query(
                "INSERT INTO departments (id, name) VALUES ($1, $2)",
                [department.id, department.name]
            );
        } catch (error) {
            console.error("Error inserting department:", error);
            throw error;
        }
    }

    async insertEmployee(employee) {
        try {
            await this.query(
                "INSERT INTO employees (id, name, surname, department_id) VALUES ($1, $2, $3, $4)",
                [
                    employee.id,
                    employee.name,
                    employee.surname,
                    employee.department.id,
                ]
            );
        } catch (error) {
            console.error("Error inserting employee:", error);
            throw error;
        }
    }

    async insertSalary(salary, employee_id) {
        try {
            await this.query(
                "INSERT INTO salaries (employee_id, amount, date) VALUES ($1, $2, $3)",
                [employee_id, salary.amount, salary.date]
            );
        } catch (error) {
            console.error("Error inserting salary:", error);
            throw error;
        }
    }

    async insertDonation(donation, employee_id) {
        try {
            await this.query(
                "INSERT INTO donations (employee_id, amount, currency, date) VALUES ($1, $2, $3, $4)",
                [employee_id, donation.amount, donation.currency, donation.date]
            );
        } catch (error) {
            console.error("Error inserting donation:", error);
            throw error;
        }
    }

    async query(sql, values = []) {
        try {
            const result = await this.client.query(sql, values);

            return result.rows;
        } catch (error) {
            console.error("Error executing query:", error);
            throw error;
        }
    }

    async calculateReward() {
        try {
            const result = await this.client.query(`
                WITH total_pool AS (
                    SELECT SUM(amount) AS total_pool_amount FROM donations
                )
                SELECT
                    e.id AS employee_id,
                    e.name AS employee_name,
                    e.surname as employee_surname,
                    CASE
                        WHEN SUM(d.amount) >= 100
                        THEN ROUND((SUM(d.amount) / tp.total_pool_amount) * 10000, 2)
                        ELSE 0
                    END AS reward
                FROM
                    employees e
                JOIN
                    donations d ON e.id = d.employee_id
                CROSS JOIN
                    total_pool tp
                GROUP BY
                    e.id, e.name, tp.total_pool_amount
                HAVING
                    SUM(d.amount) >= 100
                
                `);
            return result.rows;
        } catch (error) {
            console.error("Error calculating reward:", error);
            throw error;
        }
    }

    async disconnect() {
        try {
            await this.client.end();
        } catch (error) {
            console.error(
                "Error disconnecting from PostgreSQL database:",
                error
            );
            throw error;
        }
    }
}

module.exports = Database;
