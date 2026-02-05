const { BankDetail } = require('../models');

const updateBankDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { holderName, bankName, branch, accountNumber, ifscCode } = req.body;

        const bank = await BankDetail.findByIdAndUpdate(
            id,
            { holderName, bankName, branch, accountNumber, ifscCode },
            { new: true }
        );

        if (!bank) {
            return res.status(404).json({ success: false, error: 'Bank account not found' });
        }

        res.json({
            success: true,
            data: bank
        });
    } catch (error) {
        next(error);
    }
};

const deleteBankDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const bank = await BankDetail.findByIdAndDelete(id);

        if (!bank) {
            return res.status(404).json({ success: false, error: 'Bank account not found' });
        }

        res.json({
            success: true,
            message: 'Bank account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateBankDetail,
    deleteBankDetail
};
