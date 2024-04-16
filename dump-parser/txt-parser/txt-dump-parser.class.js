const DumpParserStrategy = require("../strategy/dump-parser.strategy");
const STATEMENT_TYPES = require("../enums/statement-types.enum");

class TxtDumpParser extends DumpParserStrategy {
    parse(jsonData) {
        let [employeeData, exchangeRatesData] = this._splitData(
            jsonData,
            "Employee",
            "Rates"
        );

        employeeData = this._prepareData(employeeData);
        [exchangeRatesData] = this._prepareData([exchangeRatesData]);

        const employees = this._parseEmployeeData(employeeData);
        const departments = this._parseDepartmentData(employees);
        const exchangeRates = this._parseExchangeRates(exchangeRatesData);

        return { employees, departments, exchangeRates };
    }

    _splitData(data, startToken, endToken) {
        let employeesData = data.split(startToken);
        employeesData.shift();

        const lastIndex = employeesData.length - 1;

        const lastEmployee = employeesData[lastIndex].split(endToken)[0];
        const excangeRates = employeesData[lastIndex].split(endToken)[1];

        employeesData[lastIndex] = lastEmployee;

        return [employeesData, excangeRates];
    }

    _parseEmployeeData(data) {
        return data.map((employeeData) => {
            const lines = employeeData.split("\n").map((line) => line.trim());

            return {
                id: parseInt(this._getLineValue(lines[0])),
                name: this._getLineValue(lines[1]),
                surname: this._getLineValue(lines[2]),
                department: {
                    id: parseInt(this._getLineValue(lines[4])),
                    name: this._getLineValue(lines[5]),
                },
                salaries: this._extractItems(lines, STATEMENT_TYPES.SALARY),
                donations: this._extractItems(lines, STATEMENT_TYPES.DONATION),
            };
        });
    }

    _parseDepartmentData(employees) {
        const departments = [];

        employees.forEach((employee) => {
            const department = departments.find(
                (dept) => dept.id === employee.department.id
            );

            if (!department) {
                departments.push({
                    id: employee.department.id,
                    name: employee.department.name,
                });
            }
        });

        return departments;
    }

    _parseExchangeRates(data) {
        const lines = data.split("\n").map((line) => line.trim());

        return this._extractItems(lines, STATEMENT_TYPES.EXCHANGE_RATE);
    }

    _extractItems(lines, key) {
        const items = [];
        let currIndex = lines.indexOf(key);

        while (currIndex !== -1) {
            switch (key) {
                case STATEMENT_TYPES.SALARY:
                    items.push(this._parseEmployeeSalary(lines, currIndex));
                    break;
                case STATEMENT_TYPES.DONATION:
                    items.push(this._parseEmployeeDonation(lines, currIndex));
                    break;
                case STATEMENT_TYPES.EXCHANGE_RATE:
                    items.push(this._parseExchangeRate(lines, currIndex));
                    break;
            }

            currIndex = this._getNextIndex(lines, key, currIndex);
        }

        return items;
    }

    _parseEmployeeSalary(lines, currentIndex) {
        const idIndex = currentIndex + 1;
        const dateIndex = currentIndex + 3;
        const amountIndex = currentIndex + 2;

        return {
            id: parseInt(this._getLineValue(lines[idIndex])),
            date: new Date(this._getLineValue(lines[dateIndex])).toUTCString(),
            amount: parseFloat(this._getLineValue(lines[amountIndex])).toFixed(
                2
            ),
        };
    }

    _parseEmployeeDonation(lines, currentIndex) {
        const idIndex = currentIndex + 1;
        const dateIndex = currentIndex + 2;
        const amountIndex = currentIndex + 3;

        const [amount, currency] = this._getLineValue(lines[amountIndex]).split(
            " "
        );

        return {
            id: parseInt(this._getLineValue(lines[idIndex])),
            date: new Date(this._getLineValue(lines[dateIndex])).toUTCString(),
            amount: parseFloat(amount).toFixed(2),
            currency,
        };
    }

    _parseExchangeRate(lines, currentIndex) {
        const dateIndex = currentIndex + 1;
        const signIndex = currentIndex + 2;
        const rateIndex = currentIndex + 3;

        return {
            date: new Date(this._getLineValue(lines[dateIndex])).toUTCString(),
            value: parseFloat(this._getLineValue(lines[rateIndex])).toFixed(2),
            sign: this._getLineValue(lines[signIndex]),
        };
    }

    _getNextIndex(lines, key, currentIndex) {
        return lines.findIndex(
            (line, index) => index > currentIndex && line === key
        );
    }

    _getLineValue(line) {
        return line.split(":")[1].trim();
    }

    _prepareData(data) {
        return data.map((item) => this._replaceNewLines(item));
    }

    _replaceNewLines(str) {
        return str.replace(/\n\s*/g, "\n").trim();
    }
}

module.exports = TxtDumpParser;
