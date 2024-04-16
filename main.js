require("dotenv").config();

const TxtDumpParser = require("./dump-parser/txt-parser/txt-dump-parser.class");
const FileManager = require("./file-manager/classes/file-manager.class");
const CurrencyCalculator = require("./currency-calculator/currency-calculator.class");
const Database = require("./database/database.class");

const data = FileManager.readData("./database/dump.txt");
const dumpParser = new TxtDumpParser();

let { employees, departments, exchangeRates } = dumpParser.parse(data);

const currencyCalculator = new CurrencyCalculator(exchangeRates);

for (const employee of employees) {
    employee.donations = currencyCalculator.calculateEmployeeDonationsInUSD(
        employee.donations
    );
}

(async () => {
    const db = new Database({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT,
    });

    await db.connect();

    await db.createTables();

    await Promise.all(
        departments.map((department) => db.insertDepartment(department))
    );

    await Promise.all(employees.map((employee) => db.insertEmployee(employee)));

    for (const employee of employees) {
        await Promise.all(
            employee.salaries.map((salary) =>
                db.insertSalary(salary, employee.id)
            ),
            employee.donations.map((donation) =>
                db.insertDonation(donation, employee.id)
            )
        );
    }

    await db.disconnect();
})();
