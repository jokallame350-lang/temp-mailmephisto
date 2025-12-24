import express from 'express';
import Iyzipay from 'iyzipay';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

// Güncel Sandbox Anahtarlarınız
const iyzipay = new Iyzipay({
    apiKey: 'sandbox-PPwh2zPI0ftAaDzYJckUHm0OZdaB8AQG', 
    secretKey: 'sandbox-ZsUOKYKaYVMLgffQtMSRUx2sKoJbx98d', 
    uri: 'https://sandbox-api.iyzipay.com'
});

app.post('/create-payment', (req, res) => {
    const { email, name, surname, amount, cycle, phone } = req.body;

    const request = {
        locale: 'tr',
        conversationId: Math.floor(Math.random() * 1000000000).toString(),
        price: (amount / 1.2).toFixed(2).toString(), 
        paidPrice: amount.toFixed(2).toString(),    
        currency: 'USD',
        basketId: 'B' + Math.floor(Math.random() * 100000),
        paymentGroup: 'PRODUCT',
        callbackUrl: 'http://localhost:5173', 
        enabledInstallments: [1],
        buyer: {
            id: 'USER_' + Math.floor(Math.random() * 10000),
            name: name || 'Guest',
            surname: surname || 'User',
            gsmNumber: phone || '+905350000000',
            email: email,
            identityNumber: '11111111111',
            city: 'Istanbul',
            country: 'Turkey',
            zipCode: '34000'
        },
        basketItems: [
            {
                id: cycle === 'month' ? 'PREM_15_MONTH' : 'PREM_15_YEAR',
                name: `Premium (15 Addresses - ${cycle})`,
                category1: 'Software',
                itemType: 'VIRTUAL', 
                price: (amount / 1.2).toFixed(2).toString()
            }
        ]
    };

    iyzipay.checkoutFormInitialize.create(request, (err, result) => {
        if (err) return res.status(500).send(err);
        res.send(result);
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Payment Server running on port ${PORT}`));