const Wallet = require('../../model/walletModel');
const User = require('../../model/userModel');

const getWalletDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    let wallet = await Wallet.findOne({ user: userId }).populate('transactions.orderId');
    
    if (!wallet) {
      wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
      await wallet.save();
    }

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet details', error: error.message });
  }
};

const addFunds = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    console.log('Request Body:', req.body);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      console.log('No wallet found. Creating a new one.');

      wallet = new Wallet({
        user: userId,
        balance: amount,  // Set initial balance with the given amount
        transactions: [
          {
            transactionType: 'credit',
            amount,
            transactionDate: new Date(),
            transactionStatus: 'completed'
          }
        ]
      });

      await wallet.save();

      return res.status(201).json({ message: 'Wallet created and funds added', wallet });
    }

    wallet.balance += amount;
    wallet.transactions.push({
      transactionType: 'credit',
      amount,
      transactionDate: new Date(),
      transactionStatus: 'completed'
    });

    await wallet.save();

    res.status(200).json({ message: 'Funds added successfully', wallet });

  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ message: 'Error adding funds', error: error.message });
  }
};


const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.params.userId;
    const wallet = await Wallet.findOne({ user: userId }).populate('transactions.orderId');
    console.log('idd',userId);
    
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    res.json(wallet.transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transaction history', error: error.message });
  }
};

exports.deductAmount = async (userId, amount, orderId) => {
  try {
    const wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet || wallet.balance < amount) {
      throw new Error('Insufficient balance');
    }

    wallet.balance -= amount;
    wallet.transactions.push({
      orderId,
      transactionType: 'debit',
      amount,
      transactionDate: new Date(),
      transactionStatus: 'completed'
    });

    await wallet.save();
    return wallet;
  } catch (error) {
    throw error;
  }
};

module.exports ={addFunds,getTransactionHistory,getWalletDetails}