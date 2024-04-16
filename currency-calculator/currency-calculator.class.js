class CurrencyCalculator {
    rates = [];

    constructor(exchangeRates) {
        this.rates = exchangeRates;
    }

    calculateEmployeeDonationsInUSD(donations) {
        const donationsInUSD = donations?.map((donation) => {
            const rate = this.rates.find(
                (rate) =>
                    rate.sign === donation.currency &&
                    rate.date === donation.date
            );

            return {
                ...donation,
                amount: rate
                    ? this._convert(donation.amount, rate.value)
                    : parseFloat(donation.amount).toFixed(2),
                currency: "USD",
            };
        });

        return donationsInUSD;
    }

    _convert(amount, rate) {
        return parseFloat(amount * rate).toFixed(2);
    }
}

module.exports = CurrencyCalculator;
