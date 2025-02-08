const Wallet = require('../../model/walletModel');
const User = require('../../model/userModel');
const mongoose=require('mongoose')

const getWalletDetails = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    let wallet = await Wallet.findOne({ user: userId }).populate('transactions.orderId');

    if (!wallet) {
      wallet = new Wallet({ user: userId, balance: 0, transactions: [] });
      await wallet.save();
    }

    let sortedTransactions = wallet.transactions.sort(
      (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
    );

    const paginatedTransactions = sortedTransactions.slice(skip, skip + limit);

    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      wallet: { ...wallet.toObject(), transactions: paginatedTransactions },
      totalPages,
      currentPage: page,
    });

  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallet details', error: error.message });
  }
};

const getWalletBalance= async (req, res) => {
  
  try {
    const { userId } = req.params;
    // console.log('userr',userId);
    // console.log('helooo')
    
    
    let wallet = await Wallet.findOne({ user: userId });
    // console.log('baalance',wallet);
    
    
    if (!wallet) {
      wallet = await Wallet.create({
        user: userId,
        balance: 0,
        transactions: []
      });
    }

    res.json({
      success: true,
      wallet
    });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

const processWalletPayment= async (req, res) => {
    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      const { userId, amount } = req.body;
      
      const wallet = await Wallet.findOne({ user: userId })
      
      if (!wallet || wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
      }

      const transaction = {
        transactionType: 'debit',
        transactionDate: new Date(),
        transactionStatus: 'completed',
        amount: amount
      };

      wallet.balance -= amount;
      wallet.transactions.push(transaction);
      
      await wallet.save()

      // await session.commitTransaction();
      
      res.json({
        success: true,
        transactionId: transaction._id,
        message: 'Payment processed successfully'
      });
    } catch (error) {
      // await session.abortTransaction();
      res.status(400).json({
        success: false,
        message: error.message
      });
    } finally {
    }
  }

const addFunds = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    // console.log('Request Body:', req.body);
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    if(amount>=10000){
      return res.status(400).json({message:'Only you can add less than 10000 at a time'})
    }

    let wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      console.log('No wallet found. Creating a new one.');

      wallet = new Wallet({
        user: userId,
        balance: amount,
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
    // console.log('idd',userId);
    
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

module.exports ={addFunds,getTransactionHistory,getWalletDetails,getWalletBalance,processWalletPayment}